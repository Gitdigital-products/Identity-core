import { ethers } from 'ethers';
import * as bip39 from 'bip39';
import { HDNodeWallet, Mnemonic } from 'ethers';
import { WalletConfig, Wallet, KeyPair, Network, SigningAlgorithm } from '@gitdigital/types';
import { encrypt, decrypt } from './crypto';

export class WalletManager {
  private config: WalletConfig;
  private wallets: Map<string, Wallet> = new Map();
  private encryptedStore: Map<string, string> = new Map();

  constructor(config: WalletConfig) {
    this.config = config;
  }

  async createWallet(
    network: Network = 'ethereum',
    options?: {
      mnemonic?: string;
      password?: string;
      name?: string;
    }
  ): Promise<Wallet> {
    const mnemonic = options?.mnemonic || bip39.generateMnemonic();
    const walletId = crypto.randomUUID();

    const wallet: Wallet = {
      id: walletId,
      network,
      mnemonic: options?.password
        ? await encrypt(mnemonic, options.password)
        : undefined,
      addresses: {},
      name: options?.name || 'Default Wallet',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Generate first account
    const account = await this.generateAccount(wallet, network, 0);
    wallet.addresses[network] = [account.address];

    this.wallets.set(walletId, wallet);
    return wallet;
  }

  async generateAccount(
    wallet: Wallet,
    network: Network,
    index: number
  ): Promise<KeyPair> {
    let mnemonic = wallet.mnemonic;
    
    if (mnemonic && this.config.encryptionKey) {
      mnemonic = await decrypt(mnemonic, this.config.encryptionKey);
    }

    if (!mnemonic) {
      throw new Error('No mnemonic available');
    }

    let keyPair: KeyPair;

    switch (network) {
      case 'ethereum':
      case 'polygon':
        const ethWallet = HDNodeWallet.fromPhrase(mnemonic);
        keyPair = {
          publicKey: ethWallet.publicKey,
          privateKey: ethWallet.privateKey,
          address: ethWallet.address,
          chainCode: ethWallet.chainCode
        };
        break;

      case 'solana':
        // Solana key derivation
        const seed = await bip39.mnemonicToSeed(mnemonic);
        const solana = require('@solana/web3.js');
        const keypair = solana.Keypair.fromSeed(seed.slice(0, 32));
        keyPair = {
          publicKey: Buffer.from(keypair.publicKey.toBytes()).toString('hex'),
          privateKey: Buffer.from(keypair.secretKey).toString('hex'),
          address: keypair.publicKey.toString()
        };
        break;

      default:
        throw new Error(`Unsupported network: ${network}`);
    }

    return keyPair;
  }

  async sign(
    walletId: string,
    message: string,
    options?: {
      accountIndex?: number;
      algorithm?: SigningAlgorithm;
    }
  ): Promise<string> {
    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const account = await this.generateAccount(wallet, wallet.network, options?.accountIndex || 0);
    
    switch (wallet.network) {
      case 'ethereum':
      case 'polygon':
        const ethWallet = new ethers.Wallet(account.privateKey);
        return await ethWallet.signMessage(message);

      case 'solana':
        const solana = require('@solana/web3.js');
        const keypair = solana.Keypair.fromSecretKey(
          Buffer.from(account.privateKey, 'hex')
        );
        const signature = keypair.sign(Buffer.from(message));
        return Buffer.from(signature).toString('hex');

      default:
        throw new Error(`Unsupported network for signing: ${wallet.network}`);
    }
  }

  async verify(
    address: string,
    message: string,
    signature: string,
    network: Network = 'ethereum'
  ): Promise<boolean> {
    switch (network) {
      case 'ethereum':
      case 'polygon':
        return ethers.verifyMessage(message, signature) === address;

      case 'solana':
        const solana = require('@solana/web3.js');
        const publicKey = new solana.PublicKey(address);
        return publicKey.verify(
          Buffer.from(message),
          Buffer.from(signature, 'hex')
        );

      default:
        throw new Error(`Unsupported network for verification: ${network}`);
    }
  }

  async encryptWallet(
    walletId: string,
    password: string
  ): Promise<void> {
    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    if (wallet.mnemonic) {
      wallet.mnemonic = await encrypt(wallet.mnemonic, password);
      wallet.updatedAt = new Date();
    }
  }

  async decryptWallet(
    walletId: string,
    password: string
  ): Promise<Wallet> {
    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    if (!wallet.mnemonic) {
      throw new Error('Wallet is not encrypted');
    }

    const decryptedMnemonic = await decrypt(wallet.mnemonic, password);
    
    return {
      ...wallet,
      mnemonic: decryptedMnemonic
    };
  }

  async exportWallet(
    walletId: string,
    format: 'json' | 'keystore' | 'mnemonic' = 'json'
  ): Promise<string> {
    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    switch (format) {
      case 'json':
        return JSON.stringify(wallet, null, 2);
      
      case 'keystore':
        // Implement keystore export
        return JSON.stringify({
          version: 1,
          id: wallet.id,
          crypto: {
            // Add encryption details
          }
        });
      
      case 'mnemonic':
        if (!wallet.mnemonic) {
          throw new Error('Mnemonic not available');
        }
        if (this.config.encryptionKey) {
          return await decrypt(wallet.mnemonic, this.config.encryptionKey);
        }
        return wallet.mnemonic;
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  getWallet(walletId: string): Wallet | undefined {
    return this.wallets.get(walletId);
  }

  listWallets(): Wallet[] {
    return Array.from(this.wallets.values());
  }

  async deleteWallet(walletId: string): Promise<void> {
    this.wallets.delete(walletId);
    this.encryptedStore.delete(walletId);
  }
}

export { WalletConfig, Wallet, KeyPair, Network } from '@gitdigital/types';
