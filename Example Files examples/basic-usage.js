const { IdentityCore } = require('@gitdigital/core');

async function main() {
  // Initialize the identity system
  const identity = new IdentityCore({
    wallet: {
      defaultNetwork: 'ethereum',
      providers: {
        ethereum: {
          rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY'
        }
      }
    },
    oauth: {
      jwtSecret: 'your-jwt-secret-key-here',
      accessTokenLifetime: 3600
    },
    did: {
      methods: ['key', 'ethr']
    }
  });

  // Create a new user
  const user = await identity.createUser({
    name: 'John Doe',
    email: 'john@example.com'
  });

  console.log('User created:', {
    id: user.id,
    did: user.did,
    walletId: user.walletId
  });

  // Issue a credential
  const credential = await identity.issueCredential(
    user, // Issuer
    user, // Subject (self-issued)
    {
      type: 'IdentityCredential',
      givenName: 'John',
      familyName: 'Doe',
      email: 'john@example.com',
      birthDate: '1990-01-01'
    },
    365 * 24 * 60 * 60 // Expires in 1 year
  );

  console.log('\nCredential issued:', {
    id: credential.id,
    issuer: credential.issuer,
    expirationDate: credential.expirationDate
  });

  // Verify the credential
  const isValid = await identity.verifyCredential(credential);
  console.log('\nCredential valid:', isValid);

  // Create OAuth authentication URL
  const authRequest = await identity.authenticateWithOAuth(
    'your-client-id',
    'http://localhost:3000/callback',
    ['openid', 'profile', 'email']
  );

  console.log('\nOAuth URL:', authRequest.url);
}

main().catch(console.error);
