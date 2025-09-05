# AnyLingo Landing Page

This is the landing page and subscription system for AnyLingo™, a revolutionary language learning platform.

## Structure

```
landing/
├── index.html          # Main landing page
├── signup.html         # Signup page with payment integration
├── css/
│   └── landing.css     # Custom styles for landing page
├── js/
│   ├── landing.js      # Landing page functionality
│   └── signup.js       # Signup form handling
├── app/                # Your existing AnyLingo application
│   ├── index.html
│   ├── script.js
│   ├── styles.css
│   └── config.js
└── README.md           # This file
```

## Features

### Landing Page (`index.html`)
- **Hero Section**: Clear value proposition and call-to-action
- **Features Section**: Three revolutionary innovations
- **How It Works**: Subconscious training explanation
- **Benefits**: 5x faster learning, etc.
- **Pricing**: Free trial with $19.99/month after
- **Responsive Design**: Works on all devices

### Signup Page (`signup.html`)
- **User Registration**: Name, email, password, target language
- **Trial Information**: 7-day free trial details
- **Payment Methods**: Square (credit cards) and Speed (Bitcoin Lightning)
- **Form Validation**: Real-time validation and error handling
- **Auto-save**: Form data saved locally

## Next Steps

### Phase 1: Backend Setup (Recommended)
1. **Node.js Backend**
   - User authentication system
   - Database setup (PostgreSQL/MongoDB)
   - API endpoints for user management

2. **Payment Integration**
   - Square API integration for credit card payments
   - Speed API integration for Bitcoin Lightning
   - Subscription management system

3. **User Management**
   - User registration and login
   - Trial period management
   - Subscription status tracking

### Phase 2: Authentication System
1. **Email/Password Authentication**
   - JWT token-based authentication
   - Password hashing with bcrypt
   - Session management

2. **Optional Nostr Integration**
   - Nostr authentication for advanced users
   - Decentralized identity support

### Phase 3: Payment Processing
1. **Square Integration**
   - Credit card payment processing
   - Subscription management
   - Webhook handling

2. **Speed Integration**
   - Bitcoin Lightning payments
   - Real-time payment confirmation
   - Multi-currency support

### Phase 4: App Integration
1. **User Access Control**
   - Trial period restrictions
   - Subscription-based feature access
   - User data persistence

2. **Seamless Experience**
   - Single sign-on between landing and app
   - User preference synchronization
   - Progress tracking

## Technical Stack

### Frontend
- **HTML5/CSS3**: Semantic markup and modern styling
- **Tailwind CSS**: Utility-first CSS framework
- **Vanilla JavaScript**: No framework dependencies
- **Responsive Design**: Mobile-first approach

### Backend (To be implemented)
- **Node.js**: Server-side JavaScript
- **Express.js**: Web application framework
- **PostgreSQL**: Relational database
- **JWT**: Authentication tokens
- **Square API**: Payment processing
- **Speed API**: Bitcoin Lightning payments

## Deployment

### Current Setup
- Static file hosting (Netlify, Vercel, or GitHub Pages)
- No backend required for landing page

### Future Setup
- Full-stack deployment (Vercel, Railway, or Heroku)
- Database hosting (Supabase, Railway, or AWS)
- CDN for static assets

## Development

### Local Development
1. Clone the repository
2. Navigate to the `landing` directory
3. Open `index.html` in a web browser
4. For development server: `python3 -m http.server 8000`

### Testing
- Test signup form validation
- Test responsive design on different devices
- Test payment flow (when implemented)

## Branding

### Colors
- **Primary Blue**: #3B82F6 (Blue-600)
- **Secondary Purple**: #8B5CF6 (Purple-600)
- **Success Green**: #10B981 (Green-500)
- **Warning Orange**: #F59E0B (Yellow-500)
- **Error Red**: #EF4444 (Red-500)

### Typography
- **Font Family**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700, 800

### Logo
- **Text**: AnyLingo™
- **Color**: Blue-600 (#3B82F6)
- **Font**: Inter Bold

## Contact

For questions about the landing page or subscription system, contact the development team.

---

**AnyLingo™** - Revolutionary language learning through AI-driven subconscious training 