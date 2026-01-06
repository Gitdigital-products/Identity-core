const express = require('express');
const cors = require('cors');
const { IdentityCore } = require('@gitdigital/core');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Identity Core
const identity = new IdentityCore({
  wallet: { defaultNetwork: 'ethereum' },
  oauth: { jwtSecret: process.env.JWT_SECRET || 'secret' },
  did: { methods: ['key', 'ethr'] }
});

// API Routes
app.post('/api/users', async (req, res) => {
  try {
    const user = await identity.createUser(req.body);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/credentials/issue', async (req, res) => {
  try {
    const { issuerDid, subjectDid, claim, expiresIn } = req.body;
    
    // Lookup users by DID (simplified)
    const issuer = { did: issuerDid, walletId: 'temp' };
    const subject = { did: subjectDid, walletId: 'temp' };
    
    const credential = await identity.issueCredential(
      issuer,
      subject,
      claim,
      expiresIn
    );
    
    res.json(credential);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/credentials/verify', async (req, res) => {
  try {
    const { credential } = req.body;
    const isValid = await identity.verifyCredential(credential);
    res.json({ valid: isValid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/oauth/authorize', async (req, res) => {
  try {
    const { client_id, redirect_uri, scope } = req.query;
    
    const authRequest = await identity.authenticateWithOAuth(
      client_id,
      redirect_uri,
      scope.split(' ')
    );
    
    res.redirect(authRequest.url);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/oauth/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    const tokens = await identity.handleOAuthCallback(code, state);
    res.json(tokens);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Identity Server running on port ${PORT}`);
});
