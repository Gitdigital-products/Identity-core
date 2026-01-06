#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import figlet from 'figlet';
import { IdentityCore } from '@gitdigital/core';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

// ASCII Art Banner
console.log(
  chalk.cyan(
    figlet.textSync('GitDigital Identity', { horizontalLayout: 'full' })
  )
);

console.log(
  boxen(chalk.green('Digital Identity Management System'), {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'cyan'
  })
);

program
  .name('gitdigital-identity')
  .description('CLI for managing digital identities')
  .version('1.0.0');

// User Management Commands
program
  .command('user:create')
  .description('Create a new user')
  .option('-n, --name <name>', 'User name')
  .option('-e, --email <email>', 'User email')
  .option('-o, --output <format>', 'Output format (json, yaml)', 'json')
  .action(async (options) => {
    const spinner = ora('Creating user...').start();
    
    try {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Enter user name:',
          when: !options.name,
          validate: (input) => input.length > 0 || 'Name is required'
        },
        {
          type: 'input',
          name: 'email',
          message: 'Enter user email:',
          when: !options.email,
          validate: (input) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(input) || 'Please enter a valid email';
          }
        }
      ]);

      const name = options.name || answers.name;
      const email = options.email || answers.email;

      // Initialize Identity Core
      const identity = new IdentityCore({
        wallet: { defaultNetwork: 'ethereum' },
        oauth: { jwtSecret: 'temp-secret' },
        did: { methods: ['key'] }
      });

      const user = await identity.createUser({ name, email });
      
      spinner.succeed('User created successfully!');
      
      if (options.output === 'json') {
        console.log(JSON.stringify(user, null, 2));
      } else {
        console.log(chalk.green(`User ID: ${user.id}`));
        console.log(chalk.blue(`DID: ${user.did}`));
        console.log(chalk.yellow(`Wallet ID: ${user.walletId}`));
      }
    } catch (error) {
      spinner.fail('Failed to create user');
      console.error(chalk.red(error.message));
    }
  });

program
  .command('wallet:create')
  .description('Create a new wallet')
  .option('-n, --network <network>', 'Blockchain network', 'ethereum')
  .option('-p, --password', 'Encrypt wallet with password')
  .action(async (options) => {
    const spinner = ora('Creating wallet...').start();
    
    try {
      const identity = new IdentityCore({
        wallet: { defaultNetwork: options.network },
        oauth: { jwtSecret: 'temp-secret' },
        did: { methods: ['key'] }
      });

      // Create a user to get a wallet
      const user = await identity.createUser();
      
      spinner.succeed('Wallet created successfully!');
      console.log(chalk.green(`Wallet ID: ${user.walletId}`));
      console.log(chalk.blue(`Network: ${options.network}`));
      console.log(chalk.yellow(`Associated DID: ${user.did}`));
    } catch (error) {
      spinner.fail('Failed to create wallet');
      console.error(chalk.red(error.message));
    }
  });

program
  .command('did:create')
  .description('Create a new DID')
  .option('-m, --method <method>', 'DID method (key, ethr, web)', 'key')
  .option('-n, --network <network>', 'Network (for ethr)', 'mainnet')
  .action(async (options) => {
    const spinner = ora('Creating DID...').start();
    
    try {
      const identity = new IdentityCore({
        wallet: { defaultNetwork: 'ethereum' },
        oauth: { jwtSecret: 'temp-secret' },
        did: { methods: [options.method as any] }
      });

      const user = await identity.createUser();
      
      spinner.succeed('DID created successfully!');
      console.log(chalk.green(`DID: ${user.did}`));
      console.log(chalk.blue(`Method: ${options.method}`));
      if (options.method === 'ethr') {
        console.log(chalk.yellow(`Network: ${options.network}`));
      }
    } catch (error) {
      spinner.fail('Failed to create DID');
      console.error(chalk.red(error.message));
    }
  });

program
  .command('credential:issue')
  .description('Issue a verifiable credential')
  .option('-i, --issuer <did>', 'Issuer DID')
  .option('-s, --subject <did>', 'Subject DID')
  .option('-c, --claim <json>', 'Claim as JSON string')
  .action(async (options) => {
    const spinner = ora('Issuing credential...').start();
    
    try {
      const identity = new IdentityCore({
        wallet: { defaultNetwork: 'ethereum' },
        oauth: { jwtSecret: 'temp-secret' },
        did: { methods: ['key'] }
      });

      let claim = {};
      if (options.claim) {
        claim = JSON.parse(options.claim);
      } else {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'type',
            message: 'Credential type:',
            default: 'IdentityCredential'
          },
          {
            type: 'input',
            name: 'name',
            message: 'Full name:'
          },
          {
            type: 'input',
            name: 'email',
            message: 'Email address:'
          }
        ]);
        claim = answers;
      }

      // In a real implementation, you would lookup users by DID
      const issuerUser = await identity.createUser();
      const subjectUser = await identity.createUser();

      const credential = await identity.issueCredential(
        issuerUser,
        subjectUser,
        claim,
        365 * 24 * 60 * 60 // 1 year
      );
      
      spinner.succeed('Credential issued successfully!');
      console.log(chalk.green(`Credential ID: ${credential.id}`));
      console.log(chalk.blue(`Issuer: ${credential.issuer}`));
      console.log(chalk.yellow(`Subject: ${credential.credentialSubject.id}`));
      
      // Save to file
      const filename = `credential-${Date.now()}.json`;
      fs.writeFileSync(filename, JSON.stringify(credential, null, 2));
      console.log(chalk.cyan(`Saved to: ${filename}`));
    } catch (error) {
      spinner.fail('Failed to issue credential');
      console.error(chalk.red(error.message));
    }
  });

program
  .command('server:start')
  .description('Start the identity server')
  .option('-p, --port <port>', 'Port number', '3000')
  .option('-e, --env <env>', 'Environment file')
  .action(async (options) => {
    console.log(chalk.cyan('Starting Identity Server...'));
    
    if (options.env) {
      require('dotenv').config({ path: options.env });
    }
    
    // Start the server
    const { startServer } = await import('./server');
    await startServer(parseInt(options.port));
  });

program
  .command('config:init')
  .description('Initialize configuration file')
  .action(async () => {
    const configPath = path.join(process.cwd(), 'identity.config.json');
    
    if (fs.existsSync(configPath)) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: 'Configuration file already exists. Overwrite?',
          default: false
        }
      ]);
      
      if (!overwrite) {
        console.log(chalk.yellow('Configuration initialization cancelled.'));
        return;
      }
    }

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'network',
        message: 'Default blockchain network:',
        choices: ['ethereum', 'polygon', 'solana', 'bitcoin'],
        default: 'ethereum'
      },
      {
        type: 'input',
        name: 'infuraKey',
        message: 'Infura API Key (optional):'
      },
      {
        type: 'input',
        name: 'jwtSecret',
        message: 'JWT Secret (generate random):',
        default: crypto.randomBytes(32).toString('hex')
      }
    ]);

    const config = {
      wallet: {
        defaultNetwork: answers.network,
        providers: {
          ethereum: {
            rpcUrl: answers.infuraKey 
              ? `https://mainnet.infura.io/v3/${answers.infuraKey}`
              : 'https://cloudflare-eth.com'
          }
        }
      },
      oauth: {
        jwtSecret: answers.jwtSecret,
        accessTokenLifetime: 3600,
        refreshTokenLifetime: 86400
      },
      did: {
        methods: ['key', 'ethr']
      }
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(chalk.green(`Configuration saved to: ${configPath}`));
  });

// Add help text for invalid commands
program.on('command:*', () => {
  console.error(
    chalk.red('Invalid command: %s'),
    program.args.join(' ')
  );
  console.log('See --help for a list of available commands.');
  process.exit(1);
});

program.parse(process.argv);

// Show help if no arguments
if (!process.argv.slice(2).length) {
  program.outputHelp();
    }
