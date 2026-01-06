import { Resolver } from 'did-resolver';
import { getResolver as getEthrResolver } from 'ethr-did-resolver';
import { getResolver as getWebResolver } from 'web-did-resolver';
import { getResolver as getKeyResolver } from 'key-did-resolver';
import { DIDManager, DIDConfig, DIDDocument, VerificationMethod, Service } from '@gitdigital/types';
import { createJWT, verifyJWT, JWTVerified } from 'did-jwt';
import { createVerifiableCredentialJwt, verifyCredential } from 'did-jwt-vc';

export class DIDManagerImpl implements DIDManager {
  private resolver: Resolver;
  private config: DIDConfig;
  private dids: Map<string, DIDDocument> = new Map();

  constructor(config: DIDConfig) {
    this.config = config;
    this.initializeResolver();
  }

  private initializeResolver(): void {
    const ethrResolver = getEthrResolver(this.config.ethrOptions || {
      networks: [
        { name: 'mainnet', rpcUrl: 'https://mainnet.infura.io/v3/' },
        { name: 'goerli', rpcUrl: 'https://goerli.infura.io/v3/' }
      ]
    });

    const webResolver = getWebResolver();
    const keyResolver = getKeyResolver();

    this.resolver = new Resolver({
      ...ethrResolver,
      ...webResolver,
      ...keyResolver,
      // Add custom resolvers here
    });
  }

  async create(
    method: string,
    options?: {
      keyType?: 'Ed25519' | 'Secp256k1' | 'RSA';
      provider?: string;
      network?: string;
    }
  ): Promise<DIDDocument> {
    let didDocument: DIDDocument;

    switch (method) {
      case 'key':
        didDocument = await this.createKeyDid(options?.keyType || 'Ed25519');
        break;

      case 'ethr':
        didDocument = await this.createEthrDid(options?.network || 'mainnet');
        break;

      case 'web':
        didDocument = await this.createWebDid(options?.provider || 'https');
        break;

      default:
        throw new Error(`Unsupported DID method: ${method}`);
    }

    this.dids.set(didDocument.id, didDocument);
    return didDocument;
  }

  private async createKeyDid(keyType: 'Ed25519' | 'Secp256k1' | 'RSA'): Promise<DIDDocument> {
    // Generate key pair based on keyType
    let publicKeyMultibase: string;
    
    // This is a simplified implementation
    // In production, use proper key generation libraries
    const keyId = crypto.randomUUID();
    publicKeyMultibase = `z${crypto.randomBytes(32).toString('hex')}`;

    const did = `did:key:${publicKeyMultibase}`;

    const didDocument: DIDDocument = {
      '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/suites/ed25519-2020/v1'
      ],
      id: did,
      verificationMethod: [
        {
          id: `${did}#${keyId}`,
          type: keyType === 'Ed25519' ? 'Ed25519VerificationKey2020' : 
                keyType === 'Secp256k1' ? 'EcdsaSecp256k1VerificationKey2019' :
                'RsaVerificationKey2018',
          controller: did,
          publicKeyMultibase
        }
      ],
      authentication: [`${did}#${keyId}`],
      assertionMethod: [`${did}#${keyId}`],
      capabilityInvocation: [`${did}#${keyId}`],
      capabilityDelegation: [`${did}#${keyId}`],
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };

    return didDocument;
  }

  private async createEthrDid(network: string): Promise<DIDDocument> {
    // In production, this would create an on-chain identity
    const address = `0x${crypto.randomBytes(20).toString('hex')}`;
    const did = `did:ethr:${network}:${address}`;

    const didDocument: DIDDocument = {
      '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld'
      ],
      id: did,
      verificationMethod: [
        {
          id: `${did}#controller`,
          type: 'EcdsaSecp256k1RecoveryMethod2020',
          controller: did,
          blockchainAccountId: `${address}@eip155:${network === 'mainnet' ? '1' : '5'}`
        }
      ],
      authentication: [`${did}#controller`],
      assertionMethod: [`${did}#controller`],
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };

    return didDocument;
  }

  private async createWebDid(provider: string): Promise<DIDDocument> {
    const domain = 'example.com'; // Should be configurable
    const path = `/did.json`;
    const did = `did:web:${domain}:${path.replace(/^\//, '').replace(/\.json$/, '')}`;

    const didDocument: DIDDocument = {
      '@context': 'https://www.w3.org/ns/did/v1',
      id: did,
      verificationMethod: [],
      service: [],
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };

    return didDocument;
  }

  async resolve(did: string): Promise<DIDDocument> {
    // Check local cache first
    if (this.dids.has(did)) {
      return this.dids.get(did)!;
    }

    // Resolve using universal resolver
    try {
      const resolution = await this.resolver.resolve(did);
      
      if (!resolution.didDocument) {
        throw new Error(`DID not found: ${did}`);
      }

      // Cache the resolved document
      this.dids.set(did, resolution.didDocument as DIDDocument);
      
      return resolution.didDocument as DIDDocument;
    } catch (error) {
      throw new Error(`Failed to resolve DID ${did}: ${error}`);
    }
  }

  async update(
    did: string,
    updates: {
      verificationMethod?: VerificationMethod[];
      service?: Service[];
      alsoKnownAs?: string[];
    }
  ): Promise<DIDDocument> {
    const document = await this.resolve(did);
    
    const updatedDocument: DIDDocument = {
      ...document,
      ...updates,
      updated: new Date().toISOString()
    };

    this.dids.set(did, updatedDocument);
    
    // In production, this would update the DID on the appropriate registry
    return updatedDocument;
  }

  async deactivate(did: string): Promise<boolean> {
    // Remove from local cache
    this.dids.delete(did);
    
    // In production, this would deactivate the DID on the appropriate registry
    return true;
  }

  async createJWT(
    did: string,
    payload: Record<string, any>,
    options?: {
      expiresIn?: number;
      issuer?: string;
      audience?: string;
    }
  ): Promise<string> {
    const document = await this.resolve(did);
    
    // Find appropriate verification method
    const verificationMethod = document.verificationMethod?.[0];
    
    if (!verificationMethod) {
      throw new Error('No verification method found');
    }

    // This is a simplified implementation
    // In production, use proper JWT creation with the actual private key
    const jwt = await createJWT(
      {
        ...payload,
        iss: did,
        aud: options?.audience,
        exp: options?.expiresIn 
          ? Math.floor(Date.now() / 1000) + options.expiresIn
          : undefined
      },
      {
        issuer: did,
        signer: async (data: string) => {
          // In production, this would sign with the actual private key
          return 'mock-signature';
        },
        alg: 'ES256K'
      }
    );

    return jwt;
  }

  async verifyJWT(
    jwt: string,
    options?: {
      audience?: string;
      resolver?: Resolver;
    }
  ): Promise<JWTVerified> {
    return await verifyJWT(jwt, {
      resolver: options?.resolver || this.resolver,
      audience: options?.audience
    });
  }

  async createVerifiableCredential(
    issuer: string,
    subject: string,
    claim: Record<string, any>,
    options?: {
      expirationDate?: string;
      issuanceDate?: string;
      credentialStatus?: {
        type: string;
        id: string;
      };
    }
  ): Promise<string> {
    const credentialPayload = {
      sub: subject,
      vc: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        issuer,
        issuanceDate: options?.issuanceDate || new Date().toISOString(),
        expirationDate: options?.expirationDate,
        credentialSubject: claim,
        credentialStatus: options?.credentialStatus
      }
    };

    // This is a simplified implementation
    // In production, use proper credential creation
    return await createVerifiableCredentialJwt(
      credentialPayload,
      // @ts-ignore - simplified types
      { issuer, signer: async () => 'mock-signature' }
    );
  }

  async verifyCredential(
    credentialJwt: string,
    options?: {
      audience?: string;
      resolver?: Resolver;
    }
  ): Promise<boolean> {
    try {
      await verifyCredential(credentialJwt, {
        resolver: options?.resolver || this.resolver
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async addService(
    did: string,
    service: Service
  ): Promise<DIDDocument> {
    const document = await this.resolve(did);
    
    const services = document.service || [];
    services.push(service);

    return await this.update(did, { service: services });
  }

  async addVerificationMethod(
    did: string,
    verificationMethod: VerificationMethod
  ): Promise<DIDDocument> {
    const document = await this.resolve(did);
    
    const methods = document.verificationMethod || [];
    methods.push(verificationMethod);

    return await this.update(did, { verificationMethod: methods });
  }

  async listDIDs(): Promise<string[]> {
    return Array.from(this.dids.keys());
  }

  async getDID(did: string): Promise<DIDDocument | null> {
    return this.dids.get(did) || null;
  }
}

export { DIDConfig, DIDDocument, VerificationMethod, Service } from '@gitdigital/types';
