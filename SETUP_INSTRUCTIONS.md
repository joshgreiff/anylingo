# AnyLingo Setup Instructions

## Quick Start

### Option 1: Use the Original Complete Version (Recommended)
1. Open `index_original.html` in your browser
2. This version has all styles and JavaScript inline and works immediately
3. All functionality is preserved exactly as the original

### Option 2: Use the Organized Version (For Development)
1. Open `index.html` in your browser
2. This version uses external CSS and JavaScript files
3. Better for editing and development in Cursor

## File Structure

```
anylingo-app/
├── index_original.html     # Complete working version (use this for immediate functionality)
├── index.html             # Organized version with external files
├── styles.css             # Custom CSS styles
├── script.js              # Main JavaScript application logic
├── README.md              # Project documentation
├── package.json           # Project configuration
└── SETUP_INSTRUCTIONS.md  # This file
```

## Development Workflow

1. **For immediate use**: Open `index_original.html`
2. **For development**: 
   - Open the project folder in Cursor
   - Edit `index.html`, `styles.css`, and `script.js`
   - Serve the files using a local server:
     ```bash
     python3 -m http.server 8000
     ```
   - Open http://localhost:8000 in your browser

## Key Features

- **Create Lessons**: Add new language learning content
- **Content Management**: Organize and manage lessons
- **ReadAloud**: Text-to-speech functionality
- **Translation**: Multi-language translation support
- **Drill Exercises**: Interactive learning activities
- **Recording**: Audio recording and playback

## Technologies Used

- Vanilla HTML, CSS, JavaScript
- Tailwind CSS for styling
- Web APIs: Speech Synthesis, MediaRecorder, LocalStorage
- LibreTranslate API for translations

## Browser Requirements

- Modern browser with JavaScript enabled
- Microphone access for recording features
- HTTPS recommended for full functionality

## Troubleshooting

If the organized version (`index.html`) doesn't work properly:
1. Make sure you're serving the files through a local server (not opening directly)
2. Check browser console for any errors
3. Use `index_original.html` as a fallback - it's guaranteed to work

## Notes

- All lesson data is stored in browser localStorage
- Recording features require microphone permissions
- Translation requires internet connection

