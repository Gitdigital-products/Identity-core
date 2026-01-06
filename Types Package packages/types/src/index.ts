// Core Types
export interface IdentityConfig {
  wallet: WalletConfig;
  oauth: OAuthConfig;
  did: DIDConfig;
  database?: DatabaseConfig;
  cache?: CacheConfig;
}

export interface User {
  id: string;
  did: string;
  walletId: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Credential {
  '@context': string[];
  id: string;
  type: string[];
  issuer: string;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: {
    id: string;
    [key: string]: any;
  };
  proof?: {
    type: string;
    jwt: string;
    [key: string]: any;
  };
}

export interface ProofRequest {
  id: string;
  verifier: string;
  requestedAttributes: string[];
  challenge?: string;
  expiresAt: Date;
  createdAt: Date;
}

// Wallet Types
export interface WalletConfig {
  encryptionKey?: string;
  defaultNetwork?: Network;
  providers?: Record<string, ProviderConfig>;
  security?: SecurityConfig;
}

export interface Wallet {
  id: string;
  network: Network;
  mnemonic?: string;
  addresses: Record<Network, string[]>;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KeyPair {
  publicKey: string;
  privateKey: string;
  address: string;
  chainCode?: string;
}

export type Network = 'ethereum' | 'polygon' | 'solana' | 'bitcoin' | 'cosmos' | 'polkadot';
export type SigningAlgorithm = 'secp256k1' | 'ed25519' | 'sr25519' | 'ecdsa';

export interface ProviderConfig {
  rpcUrl: string;
  chainId?: number;
  apiKey?: string;
}

export interface SecurityConfig {
  encryptionAlgorithm: 'aes-256-gcm' | 'chacha20-poly1305';
  keyDerivation: 'argon2' | 'pbkdf2';
  mfaEnabled: boolean;
}

// OAuth Types
export interface OAuthConfig {
  jwtSecret: string;
  accessTokenLifetime?: number; // seconds
  refreshTokenLifetime?: number; // seconds
  supportedGrants?: GrantType[];
  enablePKCE?: boolean;
  requireClientAuthentication?: boolean;
}

export interface Client {
  id: string;
  secret: string;
  grants: GrantType[];
  redirectUris: string[];
  scopes: Scope[];
  name: string;
  createdAt: Date;
}

export interface Token {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken?: string;
  refreshTokenExpiresAt?: Date;
  scope: Scope[];
  client: Client;
  user: User;
}

export interface AuthorizationCode {
  authorizationCode: string;
  expiresAt: Date;
  redirectUri: string;
  scope: Scope[];
  client: Client;
  user: User;
  codeChallenge?: string;
  codeChallengeMethod?: 'plain' | 'S256';
}

export type GrantType = 'authorization_code' | 'client_credentials' | 'refresh_token' | 'password';
export type Scope = 'openid' | 'profile' | 'email' | 'address' | 'phone' | 'offline_access';

// DID Types
export interface DIDConfig {
  methods: DIDMethod[];
  resolverUrl?: string;
  ethrOptions?: {
    networks: Array<{
      name: string;
      rpcUrl: string;
      registry?: string;
    }>;
  };
  universalResolverUrl?: string;
}

export interface DIDManager {
  create(method: DIDMethod, options?: any): Promise<DIDDocument>;
  resolve(did: string): Promise<DIDDocument>;
  update(did: string, updates: Partial<DIDDocument>): Promise<DIDDocument>;
  deactivate(did: string): Promise<boolean>;
}

export interface DIDDocument {
  '@context': string | string[];
  id: string;
  alsoKnownAs?: string[];
  controller?: string | string[];
  verificationMethod?: VerificationMethod[];
  authentication?: (string | VerificationMethod)[];
  assertionMethod?: (string | VerificationMethod)[];
  keyAgreement?: (string | VerificationMethod)[];
  capabilityInvocation?: (string | VerificationMethod)[];
  capabilityDelegation?: (string | VerificationMethod)[];
  service?: Service[];
  created?: string;
  updated?: string;
  proof?: Proof;
}

export interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyMultibase?: string;
  publicKeyBase58?: string;
  publicKeyHex?: string;
  publicKeyPem?: string;
  blockchainAccountId?: string;
}

export interface Service {
  id: string;
  type: string;
  serviceEndpoint: string | string[] | Record<string, any>;
}

export interface Proof {
  type: string;
  created: string;
  proofPurpose: string;
  verificationMethod: string;
  jws?: string;
  proofValue?: string;
  challenge?: string;
  domain?: string;
}

export type DIDMethod = 'key' | 'web' | 'ethr' | 'ion' | 'polygon' | 'sol' | 'btcr';

// Database Types
export interface DatabaseConfig {
  url: string;
  type: 'postgres' | 'mysql' | 'sqlite' | 'mongodb';
  synchronize?: boolean;
  logging?: boolean;
  ssl?: boolean;
}

export interface CacheConfig {
  type: 'redis' | 'memory' | 'memcached';
  url?: string;
  ttl?: number;
}

// Event Types
export interface IdentityEvent {
  type: 'user_created' | 'credential_issued' | 'wallet_created' | 'did_created';
  payload: any;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Error Types
export class IdentityError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'IdentityError';
  }
}

export class WalletError extends IdentityError {
  constructor(message: string, code: string = 'WALLET_ERROR') {
    super(message, code, 400);
    this.name = 'WalletError';
  }
}

export class OAuthError extends IdentityError {
  constructor(message: string, code: string = 'OAUTH_ERROR') {
    super(message, code, 401);
    this.name = 'OAuthError';
  }
}

export class DIDError extends IdentityError {
  constructor(message: string, code: string = 'DID_ERROR') {
    super(message, code, 400);
    this.name = 'DIDError';
  }
}

// Utility Types
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = 
  Pick<T, Exclude<keyof T, Keys>> & 
  { [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>> }[Keys];
