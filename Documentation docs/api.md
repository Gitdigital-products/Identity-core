# GitDigital Identity Core API Reference

## Core SDK

### `IdentityCore`

Main class that provides unified access to all identity operations.

```typescript
const identity = new IdentityCore(config);
```

Methods

· createUser(metadata?): Create a new user with wallet and DID
· issueCredential(issuer, subject, claim, expiresIn?): Issue a verifiable credential
· verifyCredential(credential): Verify a credential's validity
· authenticateWithOAuth(clientId, redirectUri, scope): Start OAuth flow
· handleOAuthCallback(code, state): Complete OAuth flow

Wallets Package

WalletManager

Manages cryptographic wallets across multiple blockchains.

```typescript
const walletManager = new WalletManager(config);
```

Methods

· createWallet(network, options?): Create a new wallet
· generateAccount(wallet, network, index): Generate account from wallet
· sign(walletId, message, options?): Sign a message
· verify(address, message, signature, network): Verify a signature
· encryptWallet(walletId, password): Encrypt wallet with password
· exportWallet(walletId, format): Export wallet in various formats

OAuth Package

OAuthServer

OAuth 2.0 and OpenID Connect server implementation.

```typescript
const oauth = new OAuthServer(config);
```

Methods

· registerClient(client): Register a new OAuth client
· createAuthorizationRequest(options): Create authorization URL
· exchangeCodeForToken(code, clientId?, clientSecret?): Exchange code for tokens
· validateToken(accessToken): Validate an access token
· refreshAccessToken(refreshToken): Refresh an access token

DID Package

DIDManager

Manages Decentralized Identifiers across multiple methods.

```typescript
const didManager = new DIDManager(config);
```

Methods

· create(method, options?): Create a new DID
· resolve(did): Resolve a DID to its document
· update(did, updates): Update a DID document
· deactivate(did): Deactivate a DID
· createJWT(did, payload, options?): Create a JWT using DID
· verifyJWT(jwt, options?): Verify a JWT

CLI Commands

```
gitdigital-identity user:create     # Create a new user
gitdigital-identity wallet:create   # Create a new wallet
gitdigital-identity did:create      # Create a new DID
gitdigital-identity credential:issue # Issue a verifiable credential
gitdigital-identity server:start    # Start identity server
gitdigital-identity config:init     # Initialize configuration
```

REST API Endpoints

Users

· POST /api/users - Create user
· GET /api/users/:id - Get user
· PUT /api/users/:id - Update user

Credentials

· POST /api/credentials/issue - Issue credential
· POST /api/credentials/verify - Verify credential
· GET /api/credentials/:id - Get credential

OAuth

· GET /oauth/authorize - Authorization endpoint
· POST /oauth/token - Token endpoint
· GET /oauth/userinfo - Userinfo endpoint

DID

· POST /api/dids - Create DID
· GET /api/dids/:did - Resolve DID
· PUT /api/dids/:did - Update DID
