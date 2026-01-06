# GitDigital Identity Core

A modular, TypeScript-based digital identity system providing Wallet management, OAuth 2.0/OpenID Connect, and DID (Decentralized Identifier) abstraction layer.

## Features

- **Wallet Management**: Secure key management for multiple blockchain networks
- **OAuth 2.0/OpenID Connect**: Standards-compliant authentication and authorization
- **DID Abstraction**: Unified API for multiple DID methods (did:ethr, did:key, did:web, did:polygon, etc.)
- **Verifiable Credentials**: Issue, verify, and manage W3C-compliant credentials
- **Multi-chain Support**: Ethereum, Polygon, Solana, and more
- **Plugin Architecture**: Easily extendable with custom providers

## Architecture

```

┌─────────────────────────────────────────────────┐
│                 Applications                     │
│  (Web, Mobile, Backend Services, IoT, etc.)     │
└─────────────────────────────────────────────────┘
│
┌─────────────────────────────────────────────────┐
│              Identity Core SDK                   │
│  (Unified API for all identity operations)      │
└─────────────────────────────────────────────────┘
│
┌────────────┬──────────────┬─────────────────────┐
│   Wallets  │     OAuth    │        DID          │
│   Package  │    Package   │     Package         │
└────────────┴──────────────┴─────────────────────┘
│
┌─────────────────────────────────────────────────┐
│           Blockchain Networks                    │
│  (Ethereum, Polygon, Solana, etc.)              │
└─────────────────────────────────────────────────┘

```

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 14+
- Redis 7+

### Installation

```bash
# Clone the repository
git clone https://github.com/gitdigital/identity-core.git
cd identity-core

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Start dependencies
npm run docker:up

# Build all packages
npm run build

# Run tests
npm run test

# Start development servers
npm run dev
