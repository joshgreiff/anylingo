# AnyLingo Deployment Guide

This guide covers deploying both the frontend and backend of AnyLingo to production.

## 🌐 URL Structure

### **Production URLs:**
```
Frontend: https://www.anylingo.net/
├── / (landing page - redirects based on auth)
├── /landing/ (landing page)
├── /app/ (main application - requires login)
└── /api/ (backend API)

Backend: https://api.anylingo.net/
```

### **User Flow:**
1. **New User**: `https://www.anylingo.net/` → Landing page → Sign up → `/app/`
2. **Returning User**: `https://www.anylingo.net/` → Auto-redirect to `/app/` (if logged in)
3. **Direct App Access**: `https://www.anylingo.net/app/` → Login if needed

## 🚀 Frontend Deployment (Vercel)

### **1. Deploy to Vercel**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel --prod
```

### **2. Environment Variables (Vercel Dashboard)**
```env
NODE_ENV=production
API_URL=https://api.anylingo.net
```

### **3. Custom Domain Setup**
1. Go to Vercel Dashboard → Project Settings → Domains
2. Add custom domain: `www.anylingo.net`
3. Configure DNS records as instructed by Vercel

## 🔧 Backend Deployment Options

### **Option 1: Vercel (Recommended)**

#### **Setup:**
```bash
cd backend
npm install
vercel --prod
```

#### **Environment Variables:**
```env
NODE_ENV=production
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_secure_jwt_secret
SQUARE_ENVIRONMENT=production
SQUARE_ACCESS_TOKEN=your_production_square_token
SQUARE_LOCATION_ID=your_production_location_id
FRONTEND_URL=https://www.anylingo.net
```

#### **Custom Domain:**
- Add `api.anylingo.net` in Vercel Dashboard
- Configure DNS records

### **Option 2: Railway**

#### **Setup:**
1. Connect GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push

#### **Environment Variables:**
```env
NODE_ENV=production
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
SQUARE_ACCESS_TOKEN=your_square_token
SQUARE_LOCATION_ID=your_location_id
SQUARE_ENVIRONMENT=production
FRONTEND_URL=https://www.anylingo.net
```

### **Option 3: Render**

#### **Setup:**
1. Connect GitHub repository to Render
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Configure environment variables

### **Option 4: Heroku**

#### **Setup:**
```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create app
heroku create anylingo-backend

# Add MongoDB addon
heroku addons:create mongolab

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_jwt_secret
heroku config:set SQUARE_ACCESS_TOKEN=your_square_token
heroku config:set SQUARE_LOCATION_ID=your_location_id
heroku config:set SQUARE_ENVIRONMENT=production
heroku config:set FRONTEND_URL=https://www.anylingo.net

# Deploy
git push heroku main
```

## 🗄 Database Setup

### **MongoDB Atlas (Recommended)**

1. **Create Cluster:**
   - Go to [MongoDB Atlas](https://cloud.mongodb.com)
   - Create new cluster (M0 Free tier available)
   - Choose cloud provider and region

2. **Configure Network Access:**
   - Add IP address: `0.0.0.0/0` (allow all IPs)
   - Or add specific IPs for security

3. **Create Database User:**
   - Username: `anylingo_user`
   - Password: Generate secure password
   - Role: `Read and write to any database`

4. **Get Connection String:**
   ```
   mongodb+srv://anylingo_user:<password>@cluster0.xxxxx.mongodb.net/anylingo?retryWrites=true&w=majority
   ```

## 💳 Square Configuration

### **1. Square Dashboard Setup**
1. Go to [Square Developer Dashboard](https://developer.squareup.com)
2. Create new application
3. Get Access Token and Location ID

### **2. Create Subscription Plans**
```bash
# Monthly Plan ($2.99)
curl -X POST https://connect.squareupsandbox.com/v2/catalog/object \
  -H "Square-Version: 2023-12-13" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "object": {
      "type": "SUBSCRIPTION_PLAN",
      "id": "#monthly_plan",
      "subscription_plan_data": {
        "name": "AnyLingo Monthly",
        "phases": [
          {
            "uid": "monthly_phase",
            "pricing": {
              "type": "FIXED_PRICING",
              "fixed_pricing_money": {
                "amount": 299,
                "currency": "USD"
              }
            },
            "period": "MONTHLY"
          }
        ]
      }
    }
  }'

# Annual Plan ($24.99)
curl -X POST https://connect.squareupsandbox.com/v2/catalog/object \
  -H "Square-Version: 2023-12-13" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "object": {
      "type": "SUBSCRIPTION_PLAN",
      "id": "#annual_plan",
      "subscription_plan_data": {
        "name": "AnyLingo Annual",
        "phases": [
          {
            "uid": "annual_phase",
            "pricing": {
              "type": "FIXED_PRICING",
              "fixed_pricing_money": {
                "amount": 2499,
                "currency": "USD"
              }
            },
            "period": "YEARLY"
          }
        ]
      }
    }
  }'
```

### **3. Webhook Configuration**
1. Go to Square Dashboard → Webhooks
2. Add webhook URL: `https://api.anylingo.net/api/subscriptions/webhook`
3. Select events:
   - `subscription.updated`
   - `subscription.canceled`
   - `payment.updated`

## 🔐 Security Configuration

### **1. JWT Secret**
Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### **2. Environment Variables Security**
- Never commit `.env` files to Git
- Use environment variable management in deployment platform
- Rotate secrets regularly

### **3. CORS Configuration**
Ensure backend CORS allows your frontend domain:
```javascript
app.use(cors({
    origin: process.env.FRONTEND_URL || 'https://www.anylingo.net',
    credentials: true
}));
```

## 📊 Monitoring & Analytics

### **1. Application Monitoring**
- **Vercel Analytics**: Built-in for frontend
- **Railway Metrics**: Built-in for backend
- **Heroku Metrics**: Built-in for backend

### **2. Error Tracking**
- **Sentry**: Add to both frontend and backend
- **LogRocket**: For frontend user sessions

### **3. Database Monitoring**
- **MongoDB Atlas**: Built-in monitoring
- **MongoDB Compass**: Local development

## 🚀 Deployment Checklist

### **Pre-Deployment:**
- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] Square integration tested
- [ ] JWT secrets generated
- [ ] CORS configured correctly

### **Frontend:**
- [ ] API_URL points to correct backend
- [ ] All assets load correctly
- [ ] Authentication flow works
- [ ] Responsive design tested

### **Backend:**
- [ ] All API endpoints respond correctly
- [ ] Database connections work
- [ ] Square webhooks configured
- [ ] Error handling implemented
- [ ] Rate limiting configured

### **Post-Deployment:**
- [ ] Test user registration
- [ ] Test subscription creation
- [ ] Test payment processing
- [ ] Monitor error logs
- [ ] Test webhook delivery

## 🔄 CI/CD Pipeline

### **GitHub Actions (Optional)**
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: railway/deploy@v1
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
```

## 🆘 Troubleshooting

### **Common Issues:**

1. **CORS Errors**
   - Check FRONTEND_URL in backend environment
   - Verify CORS configuration

2. **Database Connection Issues**
   - Check MONGODB_URI format
   - Verify network access in MongoDB Atlas

3. **Square Integration Issues**
   - Verify Access Token and Location ID
   - Check webhook URL configuration
   - Test in sandbox mode first

4. **Authentication Issues**
   - Verify JWT_SECRET is set
   - Check token expiration settings

## 📞 Support

For deployment issues:
1. Check deployment platform logs
2. Verify environment variables
3. Test locally with production settings
4. Contact platform support if needed

---

**Remember**: Always test in staging environment before deploying to production! 