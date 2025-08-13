// Configuration file for AnyLingo
const config = {
    // Google Translate API Key
    // Get your API key from: https://console.cloud.google.com/apis/credentials
    googleTranslateApiKey: 'YOUR_GOOGLE_TRANSLATE_API_KEY',
    
    // Fallback translation service (no API key required)
    useFallbackTranslation: true,
    
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