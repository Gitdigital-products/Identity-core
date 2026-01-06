FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY lerna.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/wallets/package.json ./packages/wallets/
COPY packages/oauth/package.json ./packages/oauth/
COPY packages/did/package.json ./packages/did/
COPY packages/types/package.json ./packages/types/
COPY packages/cli/package.json ./packages/cli/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build all packages
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

FROM node:18-alpine AS runner

WORKDIR /app

# Copy built packages
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 identity
RUN chown -R identity:nodejs /app

USER identity

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "packages/core/dist/index.js"]
