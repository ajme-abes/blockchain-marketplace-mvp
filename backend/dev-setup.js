// Development setup helper
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

const log = (color, message) => {
    console.log(`${colors[color]}${message}${colors.reset}`);
};

const checkNgrok = () => {
    try {
        execSync('ngrok version', { stdio: 'ignore' });
        return true;
    } catch (error) {
        return false;
    }
};

const installNgrok = () => {
    log('yellow', '📦 Installing ngrok...');
    try {
        execSync('npm install -g ngrok', { stdio: 'inherit' });
        log('green', '✅ ngrok installed successfully');
        return true;
    } catch (error) {
        log('red', '❌ Failed to install ngrok');
        log('yellow', '💡 Please install ngrok manually:');
        log('cyan', '   npm install -g ngrok');
        log('cyan', '   or download from: https://ngrok.com/download');
        return false;
    }
};

const setupDevelopment = () => {
    log('bright', '\n🚀 DEVELOPMENT ENVIRONMENT SETUP\n');

    // Check if ngrok is installed
    if (!checkNgrok()) {
        log('yellow', '⚠️ ngrok not found');
        const install = installNgrok();
        if (!install) return false;
    } else {
        log('green', '✅ ngrok is installed');
    }

    // Create .env.development if it doesn't exist
    const envDevPath = path.join(__dirname, '.env.development');
    if (!fs.existsSync(envDevPath)) {
        const envTemplate = `# Development environment variables
NODE_ENV=development
PORT=5000

# Local webhook URL (will be updated when using ngrok)
LOCAL_WEBHOOK_URL=http://localhost:5000/api/payments/webhook/chapa

# Database (use local or development database)
DATABASE_URL=postgresql://username:password@localhost:5432/ethiotrust_dev

# Copy these from your main .env file
JWT_SECRET=your-jwt-secret-here
CHAPA_PUBLIC_KEY=your-chapa-public-key
CHAPA_SECRET_KEY=your-chapa-secret-key
BREVO_API_KEY=your-brevo-api-key
PINATA_JWT=your-pinata-jwt

# Frontend URL for local development
FRONTEND_URL=http://localhost:8080
`;

        fs.writeFileSync(envDevPath, envTemplate);
        log('green', '✅ Created .env.development template');
        log('yellow', '💡 Please update .env.development with your actual values');
    }

    // Show next steps
    log('bright', '\n📋 NEXT STEPS:\n');
    log('cyan', '1. Update .env.development with your credentials');
    log('cyan', '2. Start development server: npm run dev');
    log('cyan', '3. For webhook testing: node dev-setup.js ngrok');
    log('cyan', '4. View all commands: node webhook-config.js commands');

    return true;
};

const startNgrok = () => {
    log('bright', '\n🌐 STARTING NGROK TUNNEL\n');

    if (!checkNgrok()) {
        log('red', '❌ ngrok not installed');
        log('yellow', '💡 Run: node dev-setup.js install');
        return;
    }

    log('yellow', '🚀 Starting ngrok tunnel on port 5000...');
    log('cyan', '💡 Make sure your backend is running on port 5000');
    log('cyan', '💡 Press Ctrl+C to stop ngrok');
    log('cyan', '💡 Copy the HTTPS URL and update Chapa webhook\n');

    try {
        execSync('ngrok http 5000', { stdio: 'inherit' });
    } catch (error) {
        log('yellow', '\n💡 ngrok stopped');
    }
};

const showStatus = () => {
    log('bright', '\n📊 DEVELOPMENT STATUS\n');

    // Check ngrok
    const hasNgrok = checkNgrok();
    log(hasNgrok ? 'green' : 'red', `ngrok: ${hasNgrok ? '✅ Installed' : '❌ Not installed'}`);

    // Check .env files
    const hasEnv = fs.existsSync(path.join(__dirname, '.env'));
    const hasEnvDev = fs.existsSync(path.join(__dirname, '.env.development'));

    log(hasEnv ? 'green' : 'red', `.env: ${hasEnv ? '✅ Found' : '❌ Missing'}`);
    log(hasEnvDev ? 'green' : 'yellow', `.env.development: ${hasEnvDev ? '✅ Found' : '⚠️ Missing (optional)'}`);

    // Check if backend is running
    try {
        const axios = require('axios');
        axios.get('http://localhost:5000/api/health', { timeout: 2000 })
            .then(() => log('green', 'Backend: ✅ Running on port 5000'))
            .catch(() => log('yellow', 'Backend: ⚠️ Not running on port 5000'));
    } catch (error) {
        log('yellow', 'Backend: ⚠️ Cannot check (axios not available)');
    }

    console.log('');
};

// Command line interface
const command = process.argv[2];

switch (command) {
    case 'install':
        setupDevelopment();
        break;

    case 'ngrok':
        startNgrok();
        break;

    case 'status':
        showStatus();
        break;

    default:
        log('bright', '\n🛠️ DEVELOPMENT SETUP TOOL\n');
        log('cyan', 'Commands:');
        log('cyan', '  node dev-setup.js install  # Setup development environment');
        log('cyan', '  node dev-setup.js ngrok    # Start ngrok tunnel');
        log('cyan', '  node dev-setup.js status   # Check development status');
        log('cyan', '');
        log('cyan', 'Other useful commands:');
        log('cyan', '  node webhook-config.js     # Show webhook configuration');
        log('cyan', '  node webhook-config.js commands  # Show all workflow commands');
        log('cyan', '  node test-local-payment.js webhook  # Test webhook locally');
        console.log('');
}