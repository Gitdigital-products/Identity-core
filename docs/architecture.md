# Architecture Overview

## System Architecture

```

┌─────────────────────────────────────────────────────────┐
│                    Client Applications                   │
│  (Web Apps, Mobile Apps, Backend Services, IoT)         │
└─────────────────────────────────────────────────────────┘
│
┌─────────────────────────────────────────────────────────┐
│                Identity Core SDK                         │
│  (TypeScript/JavaScript Library)                        │
└─────────────────────────────────────────────────────────┘
│
┌─────────────┬────────────────┬──────────────────────────┐
│   Wallets   │      OAuth     │           DID            │
│   Module    │     Module     │         Module           │
└─────────────┴────────────────┴──────────────────────────┘
│
┌─────────────────────────────────────────────────────────┐
│               Storage & Blockchain Layer                 │
│  (PostgreSQL, Redis, Ethereum, Polygon, etc.)           │
└─────────────────────────────────────────────────────────┘

```

## Data Flow

### User Creation
1. Client calls `identity.createUser()`
2. Wallet module generates key pair
3. DID module creates DID document
4. User data stored in database
5. Returns user object with DID and wallet ID

### Credential Issuance
1. Client calls `identity.issueCredential()`
2. Validate issuer and subject DIDs
3. Create credential payload
4. Sign with issuer's private key
5. Add proof to credential
6. Return signed credential

### OAuth Flow
1. Client redirects to `/oauth/authorize`
2. User authenticates (handled by application)
3. Authorization code generated
4. Client exchanges code for tokens
5. Tokens validated for protected endpoints

## Security Considerations

### Key Management
- Private keys never leave secure enclaves
- Encryption at rest for stored keys
- Hardware security module (HSM) support
- Key rotation policies

### DID Methods
- Support for multiple DID methods
- Method-specific security considerations
- On-chain vs off-chain resolution
- Registry contract security

### OAuth Security
- PKCE for public clients
- Token binding
- JWT validation
- Scope enforcement
- Refresh token rotation

## Deployment Options

### Monolithic Deployment
- All services in single container
- Simple deployment
- Good for small to medium scale

### Microservices
- Each package as separate service
- Independent scaling
- Complex deployment
- Service mesh recommended

### Serverless
- Functions for each operation
- Auto-scaling
- Pay-per-use
- Cold start considerations
```

Installation and Setup

To set up the complete project:

```bash
# Clone and install
git clone <repository-url>
cd gitdigital-identity-core
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Start dependencies
docker-compose up -d

# Build all packages
npm run build

# Run tests
npm run test

# Start development
npm run dev

# Use CLI
npx ts-node packages/cli/src/cli.ts user:create
```
