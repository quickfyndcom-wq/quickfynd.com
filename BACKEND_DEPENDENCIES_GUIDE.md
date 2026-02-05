# Node.js Backend Dependencies & Package.json Template

This file lists all the npm packages you should install for the new Node.js backend.

## Installation Instructions

```bash
# 1. Initialize project
mkdir quickfynd-backend
cd quickfynd-backend
npm init -y

# 2. Install all dependencies
npm install express fastify cors helmet dotenv mongoose firebase-admin axios joi winston
npm install stripe razorpay nodemailer imagekit
npm install bcryptjs jsonwebtoken
npm install --save-dev jest supertest nodemon

# Or use the complete package.json below
```

## Complete package.json

```json
{
  "name": "quickfynd-backend",
  "version": "1.0.0",
  "description": "QuickFynd E-Commerce Backend API - Node.js",
  "main": "src/app.js",
  "type": "module",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/",
    "seed": "node scripts/seedData.js",
    "backup": "node scripts/backupDatabase.js",
    "migrate": "node scripts/migrate.js"
  },
  "keywords": ["ecommerce", "api", "nodejs", "express", "mongodb"],
  "author": "QuickFynd Team",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "fastify": "^4.24.3",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "dotenv": "^16.3.1",
    "mongoose": "^7.6.3",
    "firebase-admin": "^12.0.0",
    "axios": "^1.6.0",
    "joi": "^17.11.0",
    "winston": "^3.11.0",
    "pino": "^8.16.1",
    "stripe": "^13.10.0",
    "razorpay": "^2.9.2",
    "nodemailer": "^6.9.6",
    "imagekit": "^4.1.3",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.1.0",
    "express-rate-limit": "^7.1.5",
    "express-validator": "^7.0.0",
    "multer": "^1.4.5-lts.1",
    "uuid": "^9.0.1",
    "moment": "^2.29.4",
    "lodash": "^4.17.21",
    "node-fetch": "^3.3.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "@types/node": "^20.9.0",
    "eslint": "^8.52.0",
    "prettier": "^3.1.0",
    "mongodb-memory-server": "^9.1.6"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

## Dependencies Explanation

### Core Framework
- **express**: Web framework (lightweight, proven)
- **fastify**: Alternative web framework (faster, modern)
- **cors**: Handle cross-origin requests
- **helmet**: Security headers

### Database
- **mongoose**: MongoDB object modeling
- **mongodb**: MongoDB driver (included with mongoose)

### Authentication & Security
- **firebase-admin**: Firebase token verification
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT token creation/verification
- **express-rate-limit**: API rate limiting

### Validation
- **joi**: Schema validation
- **express-validator**: Express request validation

### Payment Processing
- **stripe**: Stripe payments
- **razorpay**: Razorpay payments

### File Handling
- **multer**: File upload middleware
- **imagekit**: Image upload and CDN

### Email
- **nodemailer**: Email sending
- Or use SendGrid SDK if preferred

### Utilities
- **axios**: HTTP client
- **uuid**: Generate unique IDs
- **moment**: Date/time handling
- **lodash**: Utility functions
- **dotenv**: Environment variables

### Logging
- **winston**: Logging library
- **pino**: High-performance logging

### Testing
- **jest**: Testing framework
- **supertest**: HTTP assertion library
- **mongodb-memory-server**: In-memory MongoDB for testing

---

## Optional Dependencies by Feature

### If using Redis for caching:
```bash
npm install redis ioredis
```

### If using Amazon S3 instead of ImageKit:
```bash
npm install aws-sdk
```

### If using PostgreSQL instead of MongoDB:
```bash
npm install pg sequelize
```

### If using Sequelize ORM:
```bash
npm install sequelize
```

### For real-time features (WebSocket):
```bash
npm install socket.io ws
```

### For scheduled jobs:
```bash
npm install node-cron bull
```

### For better error tracking:
```bash
npm install @sentry/node
```

### For API documentation:
```bash
npm install swagger-ui-express swagger-jsdoc
```

---

## Installation Steps

```bash
# 1. Create project directory
mkdir quickfynd-backend
cd quickfynd-backend

# 2. Create package.json with the template above
# (copy the complete package.json section into your package.json)

# 3. Install all dependencies
npm install

# 4. Create project structure
mkdir -p src/{config,models,routes,controllers,middleware,services,utils}
mkdir -p tests/{unit,integration}
mkdir -p scripts

# 5. Copy .env.example to .env
cp .env.example .env

# 6. Update .env with your credentials

# 7. Start development server
npm run dev
```

---

## Suggested Project Structure

```
quickfynd-backend/
├── src/
│   ├── app.js                 # Express app setup
│   ├── server.js              # Server entry point
│   ├── config/
│   │   ├── database.js        # MongoDB connection
│   │   ├── firebase.js        # Firebase admin setup
│   │   ├── environment.js     # Environment variables
│   │   └── constants.js       # App constants
│   ├── models/                # Mongoose schemas
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   └── ... (11 more)
│   ├── routes/                # API route handlers
│   │   ├── products.js
│   │   ├── orders.js
│   │   ├── users.js
│   │   └── ... (15+ more)
│   ├── controllers/           # Business logic
│   │   ├── productController.js
│   │   ├── orderController.js
│   │   └── ... (15+ more)
│   ├── middleware/            # Custom middleware
│   │   ├── auth.js            # Firebase token verification
│   │   ├── errorHandler.js    # Global error handling
│   │   ├── validation.js      # Request validation
│   │   ├── logger.js          # Logging middleware
│   │   └── cors.js            # CORS configuration
│   ├── services/              # External integrations
│   │   ├── paymentService.js  # Stripe, Razorpay
│   │   ├── emailService.js    # SendGrid, Nodemailer
│   │   ├── shippingService.js # Delhivery
│   │   ├── imageService.js    # ImageKit
│   │   ├── firebaseService.js # Firebase operations
│   │   └── cacheService.js    # Redis (optional)
│   └── utils/
│       ├── helpers.js         # Utility functions
│       ├── validators.js      # Validation schemas
│       ├── errors.js          # Custom error classes
│       └── constants.js       # App constants
├── tests/
│   ├── unit/
│   │   └── models.test.js
│   └── integration/
│       └── routes.test.js
├── scripts/
│   ├── seedData.js            # Populate test data
│   ├── migrate.js             # Database migrations
│   └── backupDatabase.js      # Database backup
├── .env.example               # Environment template
├── .env                       # (DO NOT COMMIT - gitignored)
├── .gitignore
├── .eslintrc.js
├── .prettierrc
├── jest.config.js
├── package.json
├── package-lock.json
└── README.md
```

---

## Running the Server

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

### Run tests:
```bash
npm test
```

### Run tests with coverage:
```bash
npm run test:coverage
```

### Seed database:
```bash
npm run seed
```

---

## Version Notes

- **Node.js**: v18.0.0 or higher (same as frontend)
- **npm**: v9.0.0 or higher
- **MongoDB**: 5.0+ (compatible with Mongoose 7.x)

All package versions are production-ready as of 2026-02-05.

---

## Next Steps

1. Install all packages with the provided package.json
2. Set up your development environment variables in .env
3. Create all folders in the suggested structure
4. Start implementing models (see BACKEND_REQUIREMENTS.md Phase 2)
5. Create routes and controllers for each module
6. Write tests as you build
7. Follow the deployment checklist before going live

For more details, refer to **BACKEND_REQUIREMENTS.md**
