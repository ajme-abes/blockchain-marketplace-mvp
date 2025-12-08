# 🌍 EthioTrust Marketplace

> **A blockchain-powered e-commerce platform connecting Ethiopian producers directly with buyers, featuring transparent transactions, delivery verification, and decentralized storage.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![Polygon](https://img.shields.io/badge/Blockchain-Polygon-purple.svg)](https://polygon.technology/)
[![IPFS](https://img.shields.io/badge/Storage-IPFS-orange.svg)](https://ipfs.io/)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [API Documentation](#-api-documentation)
- [Blockchain Integration](#-blockchain-integration)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**EthioTrust Marketplace** is a next-generation e-commerce platform designed specifically for the Ethiopian market. It combines traditional marketplace functionality with cutting-edge blockchain technology to provide unprecedented transparency, trust, and security.

### Why EthioTrust?

- **🔒 Blockchain Verification**: Every transaction is permanently recorded on Polygon blockchain
- **📸 Delivery Proof**: Producers upload delivery photos stored on IPFS for complete transparency
- **🤝 Multi-Producer Support**: Enable collaboration between multiple producers on single products
- **💰 Transparent Payouts**: Automated commission calculation and payout tracking
- **🌐 Decentralized Storage**: Product images and delivery proofs stored on IPFS
- **🇪🇹 Local Payment Integration**: Chapa and ArifPay support for Ethiopian payments

---

## ✨ Key Features

### For Buyers
- 🛒 **Smart Shopping Cart** with real-time stock validation
- 🔍 **Advanced Search & Filters** by category, price, region, and rating
- 📦 **Order Tracking Timeline** with visual delivery status
- 🖼️ **Delivery Proof Verification** with IPFS-stored photos
- ⛓️ **Blockchain Verification** for all orders with Polygonscan links
- 💬 **Direct Chat** with producers
- ⚖️ **Dispute Management** with evidence upload
- ⭐ **Review & Rating System** for products and producers

### For Producers
- 📊 **Analytics Dashboard** with sales insights and trends
- 📦 **Product Management** with IPFS image storage
- 🤝 **Multi-Producer Products** with automatic revenue splitting
- 💰 **Payout Tracking** with transparent commission calculation
- 📸 **Delivery Proof Upload** to build buyer trust
- 📈 **Stock Management** with automatic out-of-stock detection
- 💬 **Order Chat** for buyer communication
- 🔔 **Real-time Notifications** for orders and payouts

### For Admins
- 👥 **User Management** with role-based access control
- ✅ **Producer Verification** system
- 💳 **Payout Management** with scheduling
- ⚖️ **Dispute Resolution** with evidence review
- 📊 **System Analytics** and monitoring
- ⚙️ **System Settings** configuration

### Blockchain & Trust Features
- ⛓️ **Immutable Transaction Records** on Polygon Amoy testnet
- 🔗 **Multi-Producer Blockchain Recording** (comma-separated)
- 📸 **IPFS Delivery Proof** with permanent storage
- 🔍 **Transaction Verification** with block number and timestamp
- 🌐 **Polygonscan Integration** for transaction exploration
- 🛡️ **Tamper-Proof Records** for dispute resolution

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18.x with TypeScript
- **UI Library**: Tailwind CSS + shadcn/ui components
- **State Management**: React Context API
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form
- **Real-time**: Socket.io Client

### Backend
- **Runtime**: Node.js 18.x
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + bcrypt
- **File Upload**: Multer
- **Real-time**: Socket.io
- **Email**: Nodemailer with multiple providers

### Blockchain & Storage
- **Blockchain**: Polygon Amoy Testnet (EVM-compatible)
- **Smart Contract**: Solidity
- **Web3 Library**: ethers.js v5
- **Decentralized Storage**: IPFS via Pinata
- **Explorer**: Polygonscan

### Payment Integration
- **Local Payments**: Chapa (Ethiopia)
- **Alternative**: ArifPay
- **Webhook Handling**: Express middleware

### DevOps & Deployment
- **Version Control**: Git & GitHub
- **Database Hosting**: Render PostgreSQL
- **Backend Hosting**: Railway / Render
- **Frontend Hosting**: Vercel / Netlify
- **Environment**: Docker support

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Buyer   │  │ Producer │  │  Admin   │  │   Chat   │   │
│  │   App    │  │   App    │  │   App    │  │  System  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ REST API + WebSocket
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js/Express)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │  Orders  │  │ Products │  │ Payments │   │
│  │ Service  │  │ Service  │  │ Service  │  │ Service  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Blockchain│  │   IPFS   │  │  Payout  │  │ Dispute  │   │
│  │ Service  │  │ Service  │  │ Service  │  │ Service  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
         ↕                    ↕                    ↕
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  PostgreSQL  │    │   Polygon    │    │     IPFS     │
│   Database   │    │  Blockchain  │    │   (Pinata)   │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- PostgreSQL 14.x or higher
- Git
- Pinata account (for IPFS)
- Polygon wallet with testnet MATIC

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/ajme-abes/blockchain-marketplace-mvp.git
cd blockchain-marketplace-mvp
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Install frontend dependencies**
```bash
cd ../frontend
npm install
```

4. **Set up environment variables**

Create `.env` files in both `backend` and `frontend` directories (see [Environment Variables](#-environment-variables))

5. **Set up the database**
```bash
cd backend
npx prisma generate
npx prisma db push
```

6. **Deploy smart contract** (if needed)
```bash
cd ../blockchain
npm install
npx hardhat run scripts/deploy.js --network amoy
```

7. **Start development servers**

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm run dev
```

8. **Access the application**
- Frontend: http://localhost:8080
- Backend API: http://localhost:5000

---

## 🔐 Environment Variables

### Backend (.env)

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# Blockchain (Polygon Amoy)
BLOCKCHAIN_RPC_URL=https://rpc-amoy.polygon.technology
BLOCKCHAIN_PRIVATE_KEY=your-wallet-private-key
CONTRACT_ADDRESS=your-deployed-contract-address

# IPFS (Pinata)
PINATA_API_KEY=your-pinata-api-key
PINATA_SECRET_KEY=your-pinata-secret-key
PINATA_JWT=your-pinata-jwt-token
IPFS_GATEWAY=https://gateway.pinata.cloud

# Payment (Chapa)
CHAPA_SECRET_KEY=your-chapa-secret-key
CHAPA_WEBHOOK_SECRET=your-webhook-secret

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM="EthioTrust <noreply@ethiotrust.com>"

# Frontend URL
FRONTEND_URL=http://localhost:8080
```

### Frontend (.env)

```env
# API
VITE_API_URL=http://localhost:5000

# App
VITE_APP_NAME=EthioTrust Marketplace
VITE_APP_URL=http://localhost:8080

# Blockchain Explorer
VITE_POLYGONSCAN_URL=https://amoy.polygonscan.com
```

---

## 📦 Deployment

### Backend Deployment (Railway/Render)

1. **Push to GitHub**
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. **Deploy to Railway**
- Connect GitHub repository
- Add environment variables
- Deploy automatically

3. **Run database migrations**
```bash
npx prisma db push
```

### Frontend Deployment (Vercel/Netlify)

1. **Build the frontend**
```bash
cd frontend
npm run build
```

2. **Deploy to Vercel**
```bash
vercel --prod
```

Or connect GitHub repository for automatic deployments.

### Database Setup (Render)

1. Create PostgreSQL database on Render
2. Copy connection string
3. Update `DATABASE_URL` in backend environment variables
4. Run migrations: `npx prisma db push`

---

## 📚 API Documentation

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/verify-email
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### Products

```http
GET    /api/products              # Get all products
GET    /api/products/:id          # Get product details
POST   /api/products              # Create product (Producer)
PUT    /api/products/:id          # Update product (Producer)
DELETE /api/products/:id          # Delete product (Producer)
PUT    /api/products/:id/status   # Update product status
```

### Orders

```http
GET  /api/orders                  # Get user orders
GET  /api/orders/:id              # Get order details
POST /api/orders                  # Create order (Buyer)
PUT  /api/orders/:id/status       # Update order status (Producer)
PUT  /api/orders/:id/status-with-proof  # Update with delivery proof
POST /api/orders/:id/cancel       # Cancel order (Buyer)
```

### Payments

```http
POST /api/payments/initialize     # Initialize payment
POST /api/payments/verify         # Verify payment
POST /api/payments/webhook        # Payment webhook (Chapa)
GET  /api/payments/status/:orderId # Get payment status
```

### Blockchain

```http
GET  /api/blockchain/status       # Get blockchain connection status
POST /api/blockchain/record       # Record transaction (internal)
GET  /api/blockchain/verify/:orderId # Verify transaction
```

### Disputes

```http
GET    /api/disputes              # Get user disputes
GET    /api/disputes/:id          # Get dispute details
POST   /api/disputes              # Create dispute
PUT    /api/disputes/:id          # Update dispute
POST   /api/disputes/:id/evidence # Upload evidence
POST   /api/disputes/:id/messages # Send message
```

---

## ⛓️ Blockchain Integration

### Smart Contract

The marketplace uses a custom Solidity smart contract deployed on Polygon Amoy testnet:

**Contract Features:**
- Record order transactions with buyer and producer IDs
- Store payment reference and amount
- Support multi-producer orders (comma-separated)
- Immutable transaction history
- Event emission for off-chain tracking

**Contract Address:** `[Your Contract Address]`

**View on Polygonscan:** https://amoy.polygonscan.com/address/[your-address]

### Transaction Flow

1. **Order Placed** → Backend validates order
2. **Payment Confirmed** → Chapa webhook triggers
3. **Blockchain Recording** → Transaction recorded on Polygon
4. **IPFS Storage** → Order details stored on IPFS
5. **Confirmation** → Buyer receives blockchain transaction hash

### Verification

Every order includes:
- Transaction hash
- Block number
- Timestamp
- Polygonscan link
- IPFS CID for delivery proof

---

## 🧪 Testing

### Run Backend Tests
```bash
cd backend
npm test
```

### Run Frontend Tests
```bash
cd frontend
npm test
```

### Test Blockchain Integration
```bash
cd backend
node test-blockchain.js
```

### Test IPFS Upload
```bash
cd backend
node test-ipfs.js
```

---

## 📊 Database Schema

Key tables:
- **Users** - User accounts with roles (BUYER, PRODUCER, ADMIN)
- **Producers** - Producer profiles with verification status
- **Products** - Product listings with IPFS metadata
- **Orders** - Order records with blockchain references
- **OrderItems** - Individual items in orders
- **BlockchainRecords** - Blockchain transaction records
- **Disputes** - Dispute cases with evidence
- **Payouts** - Producer payout records
- **Reviews** - Product reviews and ratings
- **Chats** - Buyer-producer messaging

See `backend/prisma/schema.prisma` for complete schema.

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Coding Standards
- Use TypeScript for frontend
- Follow ESLint rules
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation

---

## 🐛 Known Issues & Limitations

- Auto-delivery confirmation not yet implemented
- Product variants (size/color) not supported
- Wishlist feature pending
- Mobile app not available (web-responsive only)
- Limited to Polygon Amoy testnet (not mainnet)

---

## 🗺️ Roadmap

### Phase 1 (Completed) ✅
- [x] Core marketplace functionality
- [x] Blockchain integration
- [x] IPFS storage
- [x] Delivery proof upload
- [x] Multi-producer support
- [x] Dispute management
- [x] Payment integration

### Phase 2 (In Progress) 🚧
- [ ] Auto-delivery confirmation
- [ ] Product variants
- [ ] Wishlist feature
- [ ] Advanced analytics
- [ ] Email notifications
- [ ] SMS notifications

### Phase 3 (Planned) 📋
- [ ] Mobile app (React Native)
- [ ] AI product recommendations
- [ ] Smart contract escrow
- [ ] NFT product certificates
- [ ] Multi-language support
- [ ] Mainnet deployment

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

**Developer**: Ajmel Abes  
**GitHub**: [@ajme-abes](https://github.com/ajme-abes)

---

## 🙏 Acknowledgments

- [Polygon](https://polygon.technology/) for blockchain infrastructure
- [Pinata](https://pinata.cloud/) for IPFS storage
- [Chapa](https://chapa.co/) for payment processing
- [shadcn/ui](https://ui.shadcn.com/) for UI components
- [Prisma](https://prisma.io/) for database ORM

---

## 📞 Support

For support, email support@ethiotrust.com or open an issue on GitHub.

---

## 🌟 Star History

If you find this project useful, please consider giving it a star ⭐

---

<div align="center">

**Built with ❤️ for the Ethiopian market**

[Website](https://ethiotrust.com) • [Documentation](https://docs.ethiotrust.com) • [Report Bug](https://github.com/ajme-abes/blockchain-marketplace-mvp/issues) • [Request Feature](https://github.com/ajme-abes/blockchain-marketplace-mvp/issues)

</div>
