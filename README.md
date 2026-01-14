```markdown
<!-- Security Badges -->
![Security Foundational](https://img.shields.io/badge/security-foundational-blue)

<!-- Activity Badges -->
![Last Commit](https://img.shields.io/badge/commit-current-brightgreen)

<!-- Technology Badges -->
![License](https://img.shields.io/badge/license-MIT-yellow)
```
```markdown
<!-- Security Badges -->
![Security Foundational](https://img.shields.io/badge/security-foundational-blue)
![Security Scanning](https://img.shields.io/badge/security-scanning-inactive-red)

<!-- Activity Badges -->
![Last Commit](https://img.shields.io/badge/commit-recent-yellow)
![Release Status](https://img.shields.io/badge/releases-none-red)

<!-- Technology Badges -->
![License](https://img.shields.io/badge/license-MIT-yellow)

<!-- Quality Badges -->
![Documentation](https://img.shields.io/badge/docs-minimal-orange)

<!-- Community Badges -->
![Governance](https://img.shields.io/badge/governance-partial-orange)
```


**Core Badge Verification Workflow** (`.github/workflows/badge-verification.yml`):
```yaml
name: Badge Verification

on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight UTC
  push:
    paths:
      - '.github/workflows/**'
      - 'package.json'
      - 'requirements.txt'
  workflow_dispatch:

jobs:
  badge-verification:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Collect Repository Metrics
        run: |
          node scripts/collect-metrics.js
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Generate Badge Status
        run: |
          node scripts/compute-badges.js
      
      - name: Upload Badge Status
        uses: actions/upload-artifact@v4
        with:
          name: badge-status
          path: badge-status.json
```


```markdown
<!-- Security Badges -->
![Security Foundational](https://img.shields.io/badge/security-foundational-blue)

<!-- Activity Badges -->
![Last Commit](https://img.shields.io/badge/commit-current-brightgreen)

<!-- Technology Badges -->
![License](https://img.shields.io/badge/license-MIT-yellow)
```


```markdown
<!-- Security Badges -->
![Security Foundational](https://img.shields.io/badge/security-foundational-blue)
![Security Scanning](https://img.shields.io/badge/security-scanning-active-green)
![Dependency Status](https://img.shields.io/badge/deps-up--to--date-brightgreen)

<!-- Activity Badges -->
![Last Commit](https://img.shields.io/badge/commit-recent-yellow)
![Issues Health](https://img.shields.io/badge/issues-healthy-brightgreen)
![PR Velocity](https://img.shields.io/badge/PR-velocity-fast-brightgreen)

<!-- Maturity Badges -->
![CI Status](https://img.shields.io/badge/CI-passing-brightgreen)
![Versioning](https://img.shields.io/badge/versioning-semver-blue)
![Test Coverage](https://img.shields.io/badge/coverage-comprehensive-brightgreen)

<!-- Technology Badges -->
![Containerized](https://img.shields.io/badge/containerized-Docker-blue)
![CI Platform](https://img.shields.io/badge/CI-GitHub_Actions-blue)

<!-- Quality Badges -->
![Linting](https://img.shields.io/badge/linting-passing-brightgreen)
![Documentation](https://img.shields.io/badge/docs-complete-brightgreen)
![Code Owners](https://img.shields.io/badge/codeowners-defined-blue)

<!-- Community Badges -->
![License](https://img.shields.io/badge/license-MIT-yellow)
```


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
