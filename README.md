# AnyLingo - Language Learning Application

A comprehensive web-based language learning application that helps users develop fluency in multiple foreign languages.

## Features

- **Create Lessons**: Create new language lessons by pasting text from any source
- **Content Management**: Access, view, edit, and delete saved lessons
- **ReadAloud**: Text-to-speech functionality with voice, speed, and playback controls
- **Translation**: Translate lessons between multiple languages (sentences, paragraphs, or entire lessons)
- **Drill Exercises**: Interactive drills to improve language fluency and comprehension
- **Recording**: Record yourself reading lessons aloud and assess pronunciation

## Project Structure

```
anylingo-app/
├── index.html          # Main HTML file
├── styles.css          # Custom CSS styles
├── script.js           # Main JavaScript application logic
├── README.md           # This file
└── body_only.html      # Extracted HTML body content (development file)
```

## Technologies Used

- **HTML5**: Semantic markup and structure
- **CSS3**: Custom styles with Tailwind CSS framework
- **JavaScript (ES6+)**: Application logic and interactivity
- **Web APIs**: 
  - Speech Synthesis API for text-to-speech
  - MediaRecorder API for audio recording
  - LocalStorage API for data persistence
  - LibreTranslate API for translation services

## Getting Started

1. Open `index.html` in a modern web browser
2. The application will load with all features available
3. Click on any navigation button to access different features

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

**Note**: Some features like speech synthesis and recording require HTTPS in production environments.

## Features Overview

### Create Lessons
- Paste text from any source
- Preserves original text formatting
- Auto-saves lessons to local storage

### Content Management
- View all saved lessons
- Edit existing lessons
- Delete unwanted lessons
- Load lessons for use in other features

### ReadAloud
- Text-to-speech with multiple voice options
- Adjustable reading speed
- Play, pause, stop, and loop controls
- Voice selection based on detected language

### Translation
- Support for 12+ languages
- Three translation modes: sentence, paragraph, or full lesson
- Uses LibreTranslate API for accurate translations
- Auto-language detection

### Drill Exercises
- 5 different drill types for varied practice
- Text highlighting for focus areas
- Recording capabilities within drills
- Interactive exercises for comprehension

### Recording
- Record yourself reading lessons
- Playback recordings for self-assessment
- Save recordings for later review
- Visual feedback during recording

## Development

To modify the application:

1. Edit `index.html` for structure changes
2. Modify `styles.css` for styling updates
3. Update `script.js` for functionality changes

The application uses vanilla JavaScript with no build process required - simply edit and refresh the browser.

## Data Storage

All lesson data is stored locally in the browser's localStorage. Data persists between sessions but is specific to each browser/device.

## API Dependencies

- **Tailwind CSS**: Loaded from CDN for styling
- **LibreTranslate**: Used for translation services (https://translate.argosopentech.com/)

## License

This project is provided as-is for educational and personal use.

