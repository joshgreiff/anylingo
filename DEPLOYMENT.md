# AnyLingo Deployment Guide

## Deploying to Vercel

### Prerequisites
1. Install Node.js (version 12 or higher)
2. Install Vercel CLI: `npm install -g vercel`

### Step 1: Prepare Your Project
Your project is already set up with the necessary files:
- `index.html` - Main application file
- `styles.css` - Custom styles
- `script.js` - Application logic
- `vercel.json` - Vercel configuration
- `package.json` - Project configuration

### Step 2: Deploy to Vercel

#### Option A: Using Vercel CLI
1. Open terminal in your project directory
2. Run: `vercel`
3. Follow the prompts to link your project
4. For production deployment: `vercel --prod`

#### Option B: Using Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Sign up or log in
3. Click "New Project"
4. Import your GitHub repository or upload files
5. Vercel will automatically detect it's a static site
6. Click "Deploy"

### Step 3: Configure Environment (Optional)
If you need to configure environment variables:
1. Go to your project dashboard on Vercel
2. Navigate to Settings > Environment Variables
3. Add any required variables

### Step 4: Custom Domain (Optional)
1. In your Vercel dashboard, go to Settings > Domains
2. Add your custom domain
3. Follow the DNS configuration instructions

## Local Development

### Running Locally
```bash
# Start local development server
npm start
# or
python3 -m http.server 8000
```

### Testing Features
- **Speech Synthesis**: Works best in Chrome/Edge
- **Recording**: Requires HTTPS in production, HTTP works locally
- **Translation**: Requires internet connection

## Troubleshooting

### Common Issues

1. **Speech synthesis not working**
   - Ensure you're using a supported browser (Chrome, Edge, Safari)
   - Check that the page is served over HTTPS in production

2. **Recording not working**
   - Grant microphone permissions when prompted
   - Use HTTPS in production environments
   - Check browser console for errors

3. **Translation not working**
   - Check internet connection
   - Verify LibreTranslate API is accessible
   - Check browser console for API errors

### Browser Compatibility
- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## File Structure After Deployment
```
/
├── index.html          # Main application
├── styles.css          # Custom styles
├── script.js           # Application logic
├── vercel.json         # Vercel configuration
└── package.json        # Project metadata
```

## Features Available After Deployment
- ✅ Create and manage language lessons
- ✅ Text-to-speech functionality
- ✅ Multi-language translation
- ✅ Interactive drill exercises
- ✅ Audio recording and playback
- ✅ Local data storage (localStorage)

## Performance Notes
- The application is lightweight and loads quickly
- All data is stored locally in the browser
- No server-side processing required
- Translation API calls are made on-demand

## Security Considerations
- All data is stored locally in the browser
- No sensitive data is transmitted to external servers
- Translation API calls are made directly from the browser
- HTTPS is enforced in production for security features 