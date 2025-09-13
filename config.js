// Configuration file for AnyLingo
const config = {
    // Translation settings
    translation: {
        // Use free translation services (no API key required)
        useFreeService: true,
        
        // Optional: Google Translate API Key (for premium service)
        // Get your API key from: https://console.cloud.google.com/apis/credentials
        googleTranslateApiKey: 'YOUR_GOOGLE_TRANSLATE_API_KEY',
        
        // Fallback services
        fallbackServices: ['google', 'mymemory']
    },
    
    // App settings
    appName: 'AnyLingo',
    version: '1.0.0',
    
    // URLs
    fluencyTestingUrl: 'https://iwnkalha.manus.space/',
    
    // Features
    features: {
        translation: true,
        recording: true,
        speechSynthesis: true,
        drills: true
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
} 