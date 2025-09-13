# AnyLingo Backend API

A Node.js/Express backend for the AnyLingo language learning platform with Square payment integration.

## 🚀 Features

- **User Authentication**: JWT-based authentication with registration, login, and password reset
- **Subscription Management**: Square integration for monthly ($2.99) and annual ($24.99) subscriptions
- **Lesson Management**: CRUD operations for user-created lessons with progress tracking
- **Payment Processing**: Square payment integration for secure transactions
- **User Profiles**: Comprehensive user management with preferences and statistics
- **Progress Tracking**: Detailed analytics for learning progress and study time

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Payment**: Square API
- **Security**: bcryptjs, helmet, CORS
- **Development**: nodemon

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud)
- Square Developer Account
- Environment variables configured

## 🔧 Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000

   # Database
   MONGODB_URI=mongodb://localhost:27017/anylingo

   # JWT Secret
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=7d

   # Square Configuration
   SQUARE_ACCESS_TOKEN=your_square_access_token
   SQUARE_LOCATION_ID=your_square_location_id
   SQUARE_ENVIRONMENT=sandbox
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/stats` - Get user statistics
- `PUT /api/users/preferences` - Update user preferences

### Lessons
- `GET /api/lessons` - Get all lessons (with pagination)
- `GET /api/lessons/:id` - Get single lesson
- `POST /api/lessons` - Create new lesson
- `PUT /api/lessons/:id` - Update lesson
- `DELETE /api/lessons/:id` - Delete lesson
- `PUT /api/lessons/:id/progress` - Update lesson progress
- `PUT /api/lessons/:id/archive` - Archive lesson
- `GET /api/lessons/stats/overview` - Get lesson statistics

### Subscriptions
- `GET /api/subscriptions/plans` - Get subscription plans
- `POST /api/subscriptions/create` - Create subscription
- `POST /api/subscriptions/cancel` - Cancel subscription
- `GET /api/subscriptions/status` - Get subscription status
- `PUT /api/subscriptions/preferences` - Update subscription preferences
- `POST /api/subscriptions/webhook` - Square webhook handler
- `GET /api/subscriptions/history` - Get subscription history

### Payments
- `POST /api/payments/create` - Create payment
- `GET /api/payments/history` - Get payment history
- `GET /api/payments/:paymentId/status` - Get payment status

## 🔐 Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## 💳 Square Integration

### Setup
1. Create a Square Developer account
2. Create an application in the Square Developer Dashboard
3. Get your Access Token and Location ID
4. Set up webhook endpoints for subscription events

### Subscription Plans
- **Monthly**: $2.99/month
- **Annual**: $24.99/year

### Webhooks
The backend handles Square webhooks for:
- Subscription updates
- Subscription cancellations
- Payment updates

## 🗄 Database Models

### User
- Authentication fields (email, password)
- Profile information (firstName, lastName)
- Subscription details (status, dates, Square IDs)
- Preferences (languages, notifications)
- Statistics (lessons, study time, streaks)

### Lesson
- Content (original and translated text)
- Languages (source and target)
- Progress tracking (study time, comprehension)
- Settings (speech rate, voice, highlight mode)
- Metadata (word count, reading time)

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_secure_jwt_secret
SQUARE_ENVIRONMENT=production
SQUARE_ACCESS_TOKEN=your_production_square_token
SQUARE_LOCATION_ID=your_production_location_id
```

### Deployment Platforms
- **Vercel**: Serverless deployment
- **Heroku**: Traditional hosting
- **AWS**: EC2 or Lambda
- **DigitalOcean**: App Platform or Droplets

## 🔒 Security Features

- Password hashing with bcryptjs
- JWT token authentication
- CORS protection
- Helmet security headers
- Input validation and sanitization
- Rate limiting (recommended for production)

## 📊 Monitoring

- Request logging with Morgan
- Error handling middleware
- Database connection monitoring
- Square API error handling

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests in watch mode
npm run test:watch
```

## 📝 Development

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests

### Code Style
- Use ES6+ features
- Follow Express.js best practices
- Implement proper error handling
- Add JSDoc comments for complex functions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary software for AnyLingo.

## 🆘 Support

For support, contact the development team or create an issue in the repository. 