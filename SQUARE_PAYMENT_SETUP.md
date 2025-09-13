# Square Payment & Free Trial Setup Guide

## 🔧 **Square Configuration Required**

To fix the blank checkout box and enable payments, you need to configure Square credentials in your backend environment:

### 1. **Get Square Credentials**

1. Go to [Square Developer Dashboard](https://developer.squareup.com/apps)
2. Create a new application or use existing one
3. Get these credentials:
   - **Application ID** (for Web Payments SDK)
   - **Access Token** (for backend API calls)
   - **Location ID** (your business location)

### 2. **Backend Environment Setup**

Create a `.env` file in your `backend/` directory with:

```env
# Square Configuration
SQUARE_ACCESS_TOKEN=your_square_access_token_here
SQUARE_APPLICATION_ID=your_square_application_id_here  
SQUARE_LOCATION_ID=your_square_location_id_here
SQUARE_ENVIRONMENT=sandbox  # or 'production' for live

# Other required variables
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

### 3. **Environment Types**

- **Sandbox (Development)**: Use sandbox credentials for testing
- **Production**: Use production credentials for live payments

---

## 🆓 **Free Trial System**

### **How It Works**

1. **User Signs Up**: Creates account with payment info
2. **7-Day Free Trial**: Full access, no immediate charge
3. **Automatic Conversion**: After 7 days, converts to paid subscription
4. **Cancellation**: Users can cancel anytime during trial

### **Technical Implementation**

#### **Trial Creation Process:**
```
1. User selects plan (monthly/annual)
2. Square payment form collects card info
3. Backend creates Square customer & stores card
4. User status set to 'trial' with 7-day end date
5. Cron job monitors for expired trials
```

#### **Automatic Billing After Trial:**
- **Cron Job**: Runs every hour checking for expired trials
- **Conversion**: Creates actual Square subscription
- **Status Update**: Changes user from 'trial' to 'active'
- **Billing**: Square handles recurring payments

#### **Trial Management:**
- `GET /api/subscriptions/trial-status` - Check trial status
- `POST /api/subscriptions/cancel-trial` - Cancel before conversion
- Automatic email notifications (TODO)

### **Key Benefits:**
- ✅ **Reliable**: Uses cron jobs, not setTimeout
- ✅ **Persistent**: Survives server restarts
- ✅ **Scalable**: Handles multiple users
- ✅ **Flexible**: Easy to modify trial period

---

## 🚀 **Current Status**

### **✅ Completed:**
- ✅ Square configuration endpoint (`/api/subscriptions/square-config`)
- ✅ Frontend fetches Square config from backend
- ✅ Proper error handling for missing credentials
- ✅ Trial management system with cron jobs
- ✅ Automatic trial-to-paid conversion
- ✅ Trial cancellation functionality

### **⚠️ Needs Configuration:**
- ⚠️ Add actual Square credentials to backend `.env`
- ⚠️ Test with real Square sandbox account
- ⚠️ Deploy updated backend with trial manager

### **💡 Optional Enhancements:**
- 💡 Email notifications for trial expiry
- 💡 Admin dashboard for trial management
- 💡 Usage analytics during trial period
- 💡 Custom trial periods per user

---

## 🧪 **Testing the System**

### **1. Test Square Integration:**
```bash
# Check if Square config is accessible
curl https://anylingo-production.up.railway.app/api/subscriptions/square-config
```

### **2. Test Trial Creation:**
1. Sign up for new account
2. Select a plan on payment page
3. Enter test card: `4111 1111 1111 1111`
4. Check user status in database

### **3. Test Trial Management:**
```bash
# Check trial status
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://anylingo-production.up.railway.app/api/subscriptions/trial-status

# Cancel trial
curl -X POST -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://anylingo-production.up.railway.app/api/subscriptions/cancel-trial
```

---

## 🔒 **Security Notes**

- ✅ **Application ID**: Safe to expose to frontend
- ❌ **Access Token**: Never expose to frontend
- ✅ **Location ID**: Safe to expose to frontend
- 🔒 **Environment Variables**: Keep secure, never commit to git

---

## 📞 **Next Steps**

1. **Configure Square credentials** in backend `.env`
2. **Deploy backend** with trial manager
3. **Test payment flow** with sandbox
4. **Go live** with production credentials when ready

The payment system is now properly architected and just needs Square credentials to work! 