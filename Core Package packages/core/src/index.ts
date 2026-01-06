import { WalletManager } from '@gitdigital/wallets';
import { OAuthServer } from '@gitdigital/oauth';
import { DIDManager } from '@gitdigital/did';
import { IdentityConfig, User, Credential, ProofRequest } from '@gitdigital/types';
import { validateSync, IsString, IsObject, IsArray } from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class IdentityCore {
  private walletManager: WalletManager;
  private oauthServer: OAuthServer;
  private didManager: DIDManager;
  private config: IdentityConfig;

  constructor(config: IdentityConfig) {
    this.config = config;
    this.walletManager = new WalletManager(config.wallet);
    this.oauthServer = new OAuthServer(config.oauth);
    this.didManager = new DIDManager(config.did);
  }

  async createUser(metadata?: Record<string, any>): Promise<User> {
    const wallet = await this.walletManager.createWallet();
    const did = await this.didManager.create('key', {
      keyType: 'Ed25519',
      proofPurpose: 'assertionMethod'
    });

    const user: User = {
      id: crypto.randomUUID(),
      did: did.id,
      walletId: wallet.id,
      metadata: metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return user;
  }

  async issueCredential(
    issuer: User,
    subject: User,
    claim: Record<string, any>,
    expiresIn?: number
  ): Promise<Credential> {
    const credential: Credential = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://www.w3.org/2018/credentials/examples/v1'
      ],
      id: `urn:uuid:${crypto.randomUUID()}`,
      type: ['VerifiableCredential'],
      issuer: issuer.did,
      issuanceDate: new Date().toISOString(),
      expirationDate: expiresIn
        ? new Date(Date.now() + expiresIn * 1000).toISOString()
        : undefined,
      credentialSubject: {
        id: subject.did,
        ...claim
      }
    };

    // Sign the credential
    const proof = await this.walletManager.sign(
      issuer.walletId,
      JSON.stringify(credential)
    );

    credential.proof = {
      type: 'JwtProof2020',
      jwt: proof
    };

    return credential;
  }

  async verifyCredential(credential: Credential): Promise<boolean> {
    if (!credential.proof) {
      return false;
    }

    const did = await this.didManager.resolve(credential.issuer);
    return this.walletManager.verify(
      credential.issuer,
      JSON.stringify(credential),
      credential.proof.jwt
    );
  }

  async createProofRequest(
    verifier: User,
    requestedAttributes: string[],
    options?: { challenge?: string }
  ): Promise<ProofRequest> {
    const request: ProofRequest = {
      id: crypto.randomUUID(),
      verifier: verifier.did,
      requestedAttributes,
      challenge: options?.challenge || crypto.randomUUID(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      createdAt: new Date()
    };

    return request;
  }

  async authenticateWithOAuth(
    clientId: string,
    redirectUri: string,
    scope: string[]
  ): Promise<{ url: string; state: string }> {
    return this.oauthServer.createAuthorizationRequest({
      clientId,
      redirectUri,
      scope,
      responseType: 'code'
    });
  }

  async handleOAuthCallback(
    code: string,
    state: string
  ): Promise<{ accessToken: string; refreshToken?: string; user: User }> {
    const token = await this.oauthServer.exchangeCodeForToken(code);
    
    // In a real implementation, you would look up the user based on the token
    const user = await this.getUserByOAuthToken(token.accessToken);
    
    return {
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      user
    };
  }

  private async getUserByOAuthToken(token: string): Promise<User> {
    // Mock implementation - replace with actual user lookup
    return {
      id: crypto.randomUUID(),
      did: 'did:key:z6Mk...',
      walletId: 'wallet-123',
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}

export { IdentityConfig, User, Credential, ProofRequest } from '@gitdigital/types';
