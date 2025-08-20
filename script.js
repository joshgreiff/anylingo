// Global variables
let currentSection = 'home';
let currentLesson = null;
let lessons = {};

// Speech synthesis variables
let synth = null;
let utterance = null;
let isPlaying = false;
let isLooping = false;
let speechSynthesisSupported = false;
let isPaused = false; // Track pause state properly

// User preferences (persistent settings)
let userPreferences = {
    speechRate: 0.7,
    targetLanguage: 'en',
    selectedText: null,
    highlightedWords: []
};

// Text highlighting variables
let currentHighlightedWord = null;
let highlightInterval = null;
let currentWordIndex = 0;
let words = [];
let wordBoundaries = [];
let pausedWordIndex = null; // Track word position when paused
let pauseStartTime = 0; // Track when pause started
let totalPauseTime = 0; // Track total pause time

// Recording variables
let mediaRecorder = null;
let audioChunks = [];
let audioBlob = null;
let audioUrl = null;
let audioElement = null;
let isRecording = false;
let recordingSupported = false;

// Translation popup management
let currentTranslationPopup = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Check for speech synthesis support
    if (typeof window.speechSynthesis !== 'undefined') {
        synth = window.speechSynthesis;
        speechSynthesisSupported = true;
        
        // Initialize voices
        initVoices();
        
        // Chrome needs a little help with voices
        if (window.chrome) {
            if (synth.onvoiceschanged !== undefined) {
                synth.onvoiceschanged = initVoices;
            }
        }
    }
    
    // Check for recording support
    if (navigator.mediaDevices && typeof MediaRecorder !== 'undefined') {
        recordingSupported = true;
    }
    
    // Load lessons from localStorage
    loadLessons();
    
    // Load current lesson if available
    const savedCurrentLesson = localStorage.getItem('currentLesson');
    if (savedCurrentLesson) {
        try {
            currentLesson = JSON.parse(savedCurrentLesson);
            updateAllSections();
        } catch (error) {
            console.error('Error loading current lesson:', error);
        }
    }
    
    // Load user preferences
    loadUserPreferences();
    
    // Initialize language options
    initLanguageOptions();
    
    // Set up event listeners
    setupEventListeners();
});

// Initialize voices for speech synthesis
function initVoices() {
    if (!speechSynthesisSupported || !synth) return;
    
    const voices = synth.getVoices();
    const voiceSelect = document.getElementById('voiceSelect');
    
    // Clear existing options
    voiceSelect.innerHTML = '';
    
    if (voices.length === 0) {
        voiceSelect.innerHTML = '<option value="">No voices available</option>';
        return;
    }
    
    // Add voices to select element
    voices.forEach((voice, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${voice.name} (${voice.lang})`;
        voiceSelect.appendChild(option);
    });
    
    // Try to select a voice that matches the detected language
    if (currentLesson && currentLesson.content) {
        const detectedLang = detectLanguage(currentLesson.content);
        for (let i = 0; i < voices.length; i++) {
            if (voices[i].lang.startsWith(detectedLang)) {
                voiceSelect.value = i;
                break;
            }
        }
    }
}

// Set up event listeners
function setupEventListeners() {
    // Navigation buttons
    document.getElementById('createLessonBtn').addEventListener('click', () => showSection('createLesson'));
    document.getElementById('contentBtn').addEventListener('click', () => showSection('content'));
    document.getElementById('readAloudBtn').addEventListener('click', () => showSection('readAloud'));
    document.getElementById('translateBtn').addEventListener('click', () => showSection('translate'));
    document.getElementById('drillsBtn').addEventListener('click', () => showSection('drills'));
    document.getElementById('recordBtn').addEventListener('click', () => showSection('record'));
    
    // Create lesson buttons
    document.getElementById('saveLessonBtn').addEventListener('click', saveLesson);
    document.getElementById('createNewLessonBtn').addEventListener('click', createNewLesson);
    document.getElementById('createNewLessonFromContentBtn').addEventListener('click', createNewLesson);
    
    // ReadAloud controls
    document.getElementById('startReadingBtn').addEventListener('click', startReading);
    document.getElementById('pauseReadingBtn').addEventListener('click', pauseReading);
    document.getElementById('continueReadingBtn').addEventListener('click', continueReading);
    document.getElementById('stopReadingBtn').addEventListener('click', stopReading);
    document.getElementById('loopReadingBtn').addEventListener('click', toggleLoop);
    
    // Rate control
    document.getElementById('rateRange').addEventListener('input', updateRate);
    
    // Translation
    document.getElementById('translateBtn').addEventListener('click', translateContent);
    
    // Drill buttons
    document.getElementById('drill1Btn').addEventListener('click', () => showDrillInstructions('drill1'));
    document.getElementById('drill2Btn').addEventListener('click', () => showDrillInstructions('drill2'));
    document.getElementById('drill3Btn').addEventListener('click', () => showDrillInstructions('drill3'));
    document.getElementById('drill4Btn').addEventListener('click', () => showDrillInstructions('drill4'));
    document.getElementById('drill5Btn').addEventListener('click', () => showDrillInstructions('drill5'));
    
    // Drill 1 controls
    document.getElementById('startDrill1Btn').addEventListener('click', startDrill1);
    
    // Drill 2 controls
    document.getElementById('highlightTextBtn').addEventListener('click', enableTextHighlighting);
    document.getElementById('clearHighlightsBtn').addEventListener('click', clearHighlights);
    
    // Drill 3 controls
    document.getElementById('startDrill3Btn').addEventListener('click', startDrill3);
    
    // Drill 4 controls
    document.getElementById('startRecordingBtn').addEventListener('click', startDrillRecording);
    document.getElementById('stopRecordingBtn').addEventListener('click', stopDrillRecording);
    document.getElementById('playRecordingBtn').addEventListener('click', playDrillRecording);
    document.getElementById('saveDrillRecordingBtn').addEventListener('click', saveDrillRecording);
    document.getElementById('reRecordBtn').addEventListener('click', resetDrillRecording);
    
    // Main recording controls
    document.getElementById('startMainRecordingBtn').addEventListener('click', startMainRecording);
    document.getElementById('stopMainRecordingBtn').addEventListener('click', stopMainRecording);
    document.getElementById('playMainRecordingBtn').addEventListener('click', playMainRecording);
    document.getElementById('saveRecordingBtn').addEventListener('click', saveRecording);
    
    // Setup text selection for translation
    setupTextSelection();
}

// Show a specific section
function showSection(sectionName) {
    // Hide all sections
    const sections = ['home', 'createLesson', 'content', 'readAloud', 'translate', 'drills', 'record'];
    sections.forEach(section => {
        const element = document.getElementById(section);
        if (element) {
            element.classList.add('hidden');
        }
    });
    
    // Show the selected section
    const selectedSection = document.getElementById(sectionName);
    if (selectedSection) {
        selectedSection.classList.remove('hidden');
        currentSection = sectionName;
        
        // Update the section with current lesson data
        updateSection(sectionName);
    }
}

// Update a specific section with current lesson data
function updateSection(sectionName) {
    switch(sectionName) {
        case 'content':
            updateContentSection();
            break;
        case 'readAloud':
            updateReadAloudSection();
            break;
        case 'translate':
            updateTranslateSection();
            break;
        case 'drills':
            updateDrillsSection();
            break;
        case 'record':
            updateRecordSection();
            break;
    }
}

// Update all sections
function updateAllSections() {
    updateContentSection();
    updateReadAloudSection();
    updateTranslateSection();
    updateDrillsSection();
    updateRecordSection();
}

// Load lessons from localStorage
function loadLessons() {
    const savedLessons = localStorage.getItem('lessons');
    if (savedLessons) {
        try {
            lessons = JSON.parse(savedLessons);
        } catch (error) {
            console.error('Error loading lessons:', error);
            lessons = {};
        }
    }
}

// Load user preferences from localStorage
function loadUserPreferences() {
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
        try {
            const saved = JSON.parse(savedPreferences);
            userPreferences = { ...userPreferences, ...saved };
        } catch (error) {
            console.error('Error loading user preferences:', error);
        }
    }
}

// Save user preferences to localStorage
function saveUserPreferences() {
    localStorage.setItem('userPreferences', JSON.stringify(userPreferences));
}

// Save lessons to localStorage
function saveLessons() {
    localStorage.setItem('lessons', JSON.stringify(lessons));
}

// Create a new lesson
function createNewLesson() {
    // Clear editing state
    window.editingLessonId = null;
    
    // Clear form
    document.getElementById('lessonTitle').value = '';
    document.getElementById('lessonContent').value = '';
    
    // Clear any messages
    document.getElementById('createLessonMessage').classList.add('hidden');
    
    // Reset button text
    const saveButton = document.getElementById('saveLessonBtn');
    saveButton.textContent = 'Save Lesson';
    
    // Show create lesson section
    showSection('createLesson');
}

// Save the current lesson
function saveLesson() {
    const title = document.getElementById('lessonTitle').value.trim();
    const content = document.getElementById('lessonContent').value.trim();
    
    if (!title || !content) {
        showMessage('createLessonMessage', 'Please enter both title and content.', 'error');
        return;
    }
    
    let lesson;
    let isEditing = false;
    
    // Check if we're editing an existing lesson
    if (window.editingLessonId && lessons[window.editingLessonId]) {
        // Update existing lesson
        lesson = lessons[window.editingLessonId];
        lesson.title = title;
        lesson.content = content;
        lesson.updatedAt = new Date().toISOString();
        isEditing = true;
    } else {
        // Create new lesson
        lesson = {
            id: Date.now().toString(),
            title: title,
            content: content,
            createdAt: new Date().toISOString()
        };
        lessons[lesson.id] = lesson;
    }
    
    saveLessons();
    
    // Set as current lesson
    currentLesson = lesson;
    localStorage.setItem('currentLesson', JSON.stringify(currentLesson));
    
    // Clear editing state
    window.editingLessonId = null;
    
    // Reset form button text
    const saveButton = document.getElementById('saveLessonBtn');
    saveButton.textContent = 'Save Lesson';
    
    // Clear form
    document.getElementById('lessonTitle').value = '';
    document.getElementById('lessonContent').value = '';
    
    const message = isEditing ? 'Lesson updated successfully!' : 'Lesson saved successfully!';
    showMessage('createLessonMessage', message, 'success');
    
    updateAllSections();
}

// Show message in a section
function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.className = `mb-6 p-4 rounded-md ${type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`;
        element.classList.remove('hidden');
    }
}

// Update content section
function updateContentSection() {
    const lessonsList = document.getElementById('lessonsList');
    const selectedLessonTitle = document.getElementById('selectedLessonTitle');
    const selectedLessonContent = document.getElementById('selectedLessonContent');
    
    if (Object.keys(lessons).length === 0) {
        lessonsList.innerHTML = '<p class="text-gray-500">No lessons found. Create a new lesson to get started.</p>';
        selectedLessonTitle.textContent = 'Select a Lesson';
        selectedLessonContent.innerHTML = '<p class="text-gray-500 text-center">Select a lesson from the list to view its content</p>';
        return;
    }
    
    // Populate lessons list
    lessonsList.innerHTML = '';
    Object.values(lessons).forEach(lesson => {
        const lessonItem = document.createElement('div');
        lessonItem.className = 'p-3 border rounded-md hover:bg-gray-50 transition-colors';
        lessonItem.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex-1 cursor-pointer" onclick="selectLesson('${lesson.id}')">
                    <h4 class="font-semibold">${lesson.title}</h4>
                    <p class="text-sm text-gray-500">${new Date(lesson.createdAt).toLocaleDateString()}</p>
                </div>
                <div class="flex space-x-2 ml-3">
                    <button 
                        onclick="editLesson('${lesson.id}')" 
                        class="px-2 py-1 text-xs btn-blue text-white rounded transition-colors"
                        title="Edit lesson"
                    >
                        Edit
                    </button>
                    <button 
                        onclick="deleteLesson('${lesson.id}')" 
                        class="px-2 py-1 text-xs btn-red text-white rounded transition-colors"
                        title="Delete lesson"
                    >
                        Delete
                    </button>
                </div>
            </div>
        `;
        lessonsList.appendChild(lessonItem);
    });
    
    // Show current lesson if available
    if (currentLesson) {
        selectedLessonTitle.textContent = currentLesson.title;
        selectedLessonContent.innerHTML = `<pre class="whitespace-pre-wrap">${currentLesson.content}</pre>`;
    }
}

// Select a lesson
function selectLesson(lessonId) {
    currentLesson = lessons[lessonId];
    localStorage.setItem('currentLesson', JSON.stringify(currentLesson));
    updateAllSections();
}

// Edit a lesson
function editLesson(lessonId) {
    const lesson = lessons[lessonId];
    if (lesson) {
        // Store the lesson ID being edited
        window.editingLessonId = lessonId;
        
        // Populate the form
        document.getElementById('lessonTitle').value = lesson.title;
        document.getElementById('lessonContent').value = lesson.content;
        
        // Update the form button text
        const saveButton = document.getElementById('saveLessonBtn');
        saveButton.textContent = 'Update Lesson';
        
        // Clear any existing messages
        document.getElementById('createLessonMessage').classList.add('hidden');
        
        // Show create lesson form
        showSection('createLesson');
    }
}

// Delete a lesson
function deleteLesson(lessonId) {
    if (confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) {
        delete lessons[lessonId];
        saveLessons();
        
        // If the deleted lesson was the current lesson, clear it
        if (currentLesson && currentLesson.id === lessonId) {
            currentLesson = null;
            localStorage.removeItem('currentLesson');
        }
        
        updateContentSection();
        updateAllSections();
        
        showMessage('contentMessage', 'Lesson deleted successfully!', 'success');
    }
}

// Update ReadAloud section
function updateReadAloudSection() {
    const titleElement = document.getElementById('readAloudLessonTitle');
    const contentElement = document.getElementById('readAloudContent');
    const detectedLanguageElement = document.getElementById('detectedLanguage');
    const speechSynthesisWarningElement = document.getElementById('speechSynthesisWarning');
    
    if (!currentLesson) {
        titleElement.textContent = 'No lesson loaded';
        contentElement.innerHTML = '<p class="text-gray-500 text-center">No lesson content available</p>';
        detectedLanguageElement.classList.add('hidden');
        return;
    }
    
    titleElement.textContent = currentLesson.title;
    contentElement.innerHTML = `<pre class="whitespace-pre-wrap">${currentLesson.content}</pre>`;
    
    // Detect language
    const detectedLang = detectLanguage(currentLesson.content);
    if (detectedLang) {
        document.getElementById('languageCode').textContent = detectedLang;
        detectedLanguageElement.classList.remove('hidden');
    } else {
        detectedLanguageElement.classList.add('hidden');
    }
    
    // Check speech synthesis support
    if (!speechSynthesisSupported) {
        speechSynthesisWarningElement.classList.remove('hidden');
    } else {
        speechSynthesisWarningElement.classList.add('hidden');
    }
}

// Detect language (simple implementation)
function detectLanguage(text) {
    // This is a simple language detection based on common characters
    // In a real application, you might use a more sophisticated library
    const sample = text.substring(0, 100).toLowerCase();
    
    if (/[а-яё]/.test(sample)) return 'ru';
    if (/[一-龯]/.test(sample)) return 'zh';
    if (/[あ-ん]/.test(sample)) return 'ja';
    if (/[가-힣]/.test(sample)) return 'ko';
    if (/[à-ÿ]/.test(sample)) return 'fr';
    if (/[äöüß]/.test(sample)) return 'de';
    if (/[ñáéíóúü]/.test(sample)) return 'es';
    if (/[àèéìíîòóù]/.test(sample)) return 'it';
    
    return 'en'; // Default to English
}

// Start reading aloud
function startReading() {
    if (!currentLesson || !speechSynthesisSupported) return;
    
    stopReading(); // Stop any current reading
    
    const voiceIndex = document.getElementById('voiceSelect').value;
    const rate = parseFloat(document.getElementById('rateRange').value);
    
    utterance = new SpeechSynthesisUtterance(currentLesson.content);
    
    if (voiceIndex && synth.getVoices()[voiceIndex]) {
        utterance.voice = synth.getVoices()[voiceIndex];
    }
    
    utterance.rate = rate;
    
    // Calculate estimated duration for word highlighting
    words = currentLesson.content.split(/\s+/);
    const wordsPerMinute = 120 * rate; // Reduced from 150 to 120 for more accurate timing
    estimatedDuration = (words.length / wordsPerMinute) * 60; // Duration in seconds
    speechStartTime = Date.now();
    currentWordIndex = 0; // Reset speech position
    wordBoundaries = []; // Clear previous boundaries
    
    utterance.onstart = () => {
        isPlaying = true;
        isPaused = false;
        updateReadingButtons();
        // Start word highlighting
        startWordHighlighting();
    };
    
    utterance.onend = () => {
        isPlaying = false;
        isPaused = false;
        clearWordHighlights();
        updateReadingButtons();
        if (isLooping) {
            setTimeout(restartReading, 1000);
        }
    };
    
    utterance.onpause = () => {
        isPlaying = false;
        isPaused = true;
        clearWordHighlights();
        updateReadingButtons();
    };
    
    utterance.onresume = () => {
        isPlaying = true;
        isPaused = false;
        updateReadingButtons();
        startWordHighlighting();
    };
    
    synth.speak(utterance);
}

// Restart reading (for loop functionality)
function restartReading() {
    if (!currentLesson || !speechSynthesisSupported) return;
    
    // Don't call stopReading() to avoid interfering with loop state
    if (synth) {
        synth.cancel();
        isPlaying = false;
        clearWordHighlights();
    }
    
    const voiceIndex = document.getElementById('voiceSelect').value;
    const rate = parseFloat(document.getElementById('rateRange').value);
    
    utterance = new SpeechSynthesisUtterance(currentLesson.content);
    
    if (voiceIndex && synth.getVoices()[voiceIndex]) {
        utterance.voice = synth.getVoices()[voiceIndex];
    }
    
    utterance.rate = rate;
    
    // Calculate estimated duration for word highlighting
    words = currentLesson.content.split(/\s+/);
    const wordsPerMinute = 120 * rate;
    estimatedDuration = (words.length / wordsPerMinute) * 60;
    speechStartTime = Date.now();
    currentWordIndex = 0;
    wordBoundaries = [];
    
    utterance.onstart = () => {
        isPlaying = true;
        isPaused = false;
        updateReadingButtons();
        startWordHighlighting();
    };
    
    utterance.onend = () => {
        isPlaying = false;
        isPaused = false;
        clearWordHighlights();
        updateReadingButtons();
        if (isLooping) {
            setTimeout(restartReading, 1000);
        }
    };
    
    utterance.onpause = () => {
        isPlaying = false;
        isPaused = true;
        clearWordHighlights();
        updateReadingButtons();
    };
    
    utterance.onresume = () => {
        isPlaying = true;
        isPaused = false;
        updateReadingButtons();
        startWordHighlighting();
    };
    
    synth.speak(utterance);
}

// Pause reading
function pauseReading() {
    if (synth && isPlaying) {
        synth.pause();
        isPlaying = false;
        isPaused = true;
        // Store current word position when paused
        pausedWordIndex = currentHighlightedWord;
        // Track pause start time
        pauseStartTime = Date.now();
        // Don't clear highlights - just pause them
        if (highlightInterval) {
            clearInterval(highlightInterval);
            highlightInterval = null;
        }
        updateReadingButtons();
    }
}

// Continue reading
function continueReading() {
    if (synth && isPaused && utterance) {
        synth.resume();
        isPlaying = true;
        isPaused = false;
        // Calculate total pause time and adjust speech start time
        const pauseDuration = Date.now() - pauseStartTime;
        totalPauseTime += pauseDuration;
        // Adjust speech start time to account for pause time
        speechStartTime += pauseDuration;
        updateReadingButtons();
        // Resume highlighting from stored position
        resumeWordHighlightingFromPause();
    }
}

// Stop reading
function stopReading() {
    if (synth) {
        synth.cancel();
        isPlaying = false;
        // Don't reset isLooping here - let the user control it
        clearWordHighlights();
        updateReadingButtons();
        // Don't change the loop button text - keep the current state
    }
}

// Toggle loop
function toggleLoop() {
    isLooping = !isLooping;
    const button = document.getElementById('loopReadingBtn');
    button.textContent = isLooping ? 'Loop ON' : 'Loop OFF';
}

// Update reading buttons
function updateReadingButtons() {
    document.getElementById('startReadingBtn').disabled = isPlaying || isPaused;
    document.getElementById('pauseReadingBtn').disabled = !isPlaying;
    document.getElementById('continueReadingBtn').disabled = !isPaused;
    document.getElementById('stopReadingBtn').disabled = !isPlaying && !isPaused;
    
    // Update loop button to reflect current state
    const loopButton = document.getElementById('loopReadingBtn');
    if (loopButton) {
        loopButton.textContent = isLooping ? 'Loop ON' : 'Loop OFF';
    }
}

// Update rate display
function updateRate() {
    const rate = document.getElementById('rateRange').value;
    document.getElementById('rateValue').textContent = rate;
    
    // Save user preference
    userPreferences.speechRate = parseFloat(rate);
    saveUserPreferences();
}

// Apply saved user preferences to UI
function applyUserPreferences() {
    // Apply speech rate
    if (userPreferences.speechRate) {
        const rateRange = document.getElementById('rateRange');
        const rateValue = document.getElementById('rateValue');
        if (rateRange && rateValue) {
            rateRange.value = userPreferences.speechRate;
            rateValue.textContent = userPreferences.speechRate;
        }
    }
    
    // Apply target language
    if (userPreferences.targetLanguage) {
        const targetLanguage = document.getElementById('targetLanguage');
        if (targetLanguage) {
            targetLanguage.value = userPreferences.targetLanguage;
        }
    }
}

// Highlight words during speech synthesis
function startWordHighlighting() {
    if (!currentLesson || !isPlaying) return;
    
    // Clear any existing highlights
    clearWordHighlights();
    
    // Create word boundaries for highlighting
    wordBoundaries = [];
    let currentPos = 0;
    words.forEach((word, index) => {
        const wordStart = currentLesson.content.indexOf(word, currentPos);
        const wordEnd = wordStart + word.length;
        wordBoundaries.push({
            word: word,
            start: wordStart,
            end: wordEnd,
            index: index
        });
        currentPos = wordEnd;
    });
    
    // Start highlighting words based on speech timing with stable timing
    highlightInterval = setInterval(() => {
        if (!isPlaying) {
            clearWordHighlights();
            return;
        }
        
        // Calculate word position based on speech progress
        // Use stable timing to prevent oscillation
        const elapsedTime = Date.now() - speechStartTime;
        const timingFactor = 1.6; // Fixed speed up factor - balanced highlighting
        
        // Simple forward progression without complex adaptation
        const adjustedElapsedTime = elapsedTime * timingFactor;
        const progress = adjustedElapsedTime / (estimatedDuration * 1000);
        const targetWordIndex = Math.floor(progress * words.length);
        
        if (targetWordIndex !== currentHighlightedWord && targetWordIndex < words.length) {
            // Remove previous highlight
            if (currentHighlightedWord !== null) {
                removeWordHighlight(currentHighlightedWord);
            }
            
            // Add new highlight
            currentHighlightedWord = targetWordIndex;
            addWordHighlight(targetWordIndex);
        }
    }, 50); // Update more frequently for smoother highlighting
}

// Resume highlighting from current position (for pause/continue)
function resumeWordHighlighting() {
    if (!currentLesson || !isPlaying) return;
    
    // Create word boundaries if they don't exist
    if (wordBoundaries.length === 0) {
        let currentPos = 0;
        words.forEach((word, index) => {
            const wordStart = currentLesson.content.indexOf(word, currentPos);
            const wordEnd = wordStart + word.length;
            wordBoundaries.push({
                word: word,
                start: wordStart,
                end: wordEnd,
                index: index
            });
            currentPos = wordEnd;
        });
    }
    
    // Resume highlighting from current position with stable timing
    highlightInterval = setInterval(() => {
        if (!isPlaying) {
            clearWordHighlights();
            return;
        }
        
        // Calculate word position based on speech progress
        // Use stable timing to prevent oscillation
        const elapsedTime = Date.now() - speechStartTime;
        const timingFactor = 1.6; // Fixed speed up factor - balanced highlighting
        
        // Simple forward progression without complex adaptation
        const adjustedElapsedTime = elapsedTime * timingFactor;
        const progress = adjustedElapsedTime / (estimatedDuration * 1000);
        const targetWordIndex = Math.floor(progress * words.length);
        
        if (targetWordIndex !== currentHighlightedWord && targetWordIndex < words.length) {
            // Remove previous highlight
            if (currentHighlightedWord !== null) {
                removeWordHighlight(currentHighlightedWord);
            }
            
            // Add new highlight
            currentHighlightedWord = targetWordIndex;
            addWordHighlight(targetWordIndex);
        }
    }, 50); // Update more frequently for smoother highlighting
}

// Resume highlighting from paused position (for pause/continue)
function resumeWordHighlightingFromPause() {
    if (!currentLesson || !isPlaying) return;
    
    // Create word boundaries if they don't exist
    if (wordBoundaries.length === 0) {
        let currentPos = 0;
        words.forEach((word, index) => {
            const wordStart = currentLesson.content.indexOf(word, currentPos);
            const wordEnd = wordStart + word.length;
            wordBoundaries.push({
                word: word,
                start: wordStart,
                end: wordEnd,
                index: index
            });
            currentPos = wordEnd;
        });
    }
    
    // Start from the paused position if available
    if (pausedWordIndex !== null && pausedWordIndex >= 0) {
        currentHighlightedWord = pausedWordIndex;
        // Highlight the word at the paused position
        addWordHighlight(pausedWordIndex);
    }
    
    // Resume highlighting with very conservative timing to prevent jumping ahead
    highlightInterval = setInterval(() => {
        if (!isPlaying) {
            clearWordHighlights();
            return;
        }
        
        // Use very conservative timing after pause to prevent jumping ahead
        const elapsedTime = Date.now() - speechStartTime;
        const timingFactor = 0.8; // Much slower timing after pause
        
        // Simple forward progression with conservative timing
        const adjustedElapsedTime = elapsedTime * timingFactor;
        const progress = adjustedElapsedTime / (estimatedDuration * 1000);
        const targetWordIndex = Math.floor(progress * words.length);
        
        // Ensure we don't go backwards from paused position
        const minWordIndex = pausedWordIndex !== null ? pausedWordIndex : 0;
        const finalTargetIndex = Math.max(targetWordIndex, minWordIndex);
        
        if (finalTargetIndex !== currentHighlightedWord && finalTargetIndex < words.length) {
            // Remove previous highlight
            if (currentHighlightedWord !== null) {
                removeWordHighlight(currentHighlightedWord);
            }
            
            // Add new highlight
            currentHighlightedWord = finalTargetIndex;
            addWordHighlight(finalTargetIndex);
        }
    }, 50); // Update more frequently for smoother highlighting
}

// Add highlight to a specific word
function addWordHighlight(wordIndex) {
    const contentElement = document.getElementById('readAloudContent');
    if (!contentElement || wordIndex >= wordBoundaries.length) return;
    
    const boundary = wordBoundaries[wordIndex];
    const content = currentLesson.content;
    
    // Create highlighted version
    const before = content.substring(0, boundary.start);
    const word = content.substring(boundary.start, boundary.end);
    const after = content.substring(boundary.end);
    
    contentElement.innerHTML = `<pre class="whitespace-pre-wrap">${before}<span class="bg-green-300 text-green-800 px-1 rounded">${word}</span>${after}</pre>`;
}

// Remove highlight from a specific word
function removeWordHighlight(wordIndex) {
    const contentElement = document.getElementById('readAloudContent');
    if (!contentElement || wordIndex >= wordBoundaries.length) return;
    
    const boundary = wordBoundaries[wordIndex];
    const content = currentLesson.content;
    
    // Remove highlight by restoring original text
    const before = content.substring(0, boundary.start);
    const word = content.substring(boundary.start, boundary.end);
    const after = content.substring(boundary.end);
    
    contentElement.innerHTML = `<pre class="whitespace-pre-wrap">${before}${word}${after}</pre>`;
}

// Clear all word highlights
function clearWordHighlights() {
    if (highlightInterval) {
        clearInterval(highlightInterval);
        highlightInterval = null;
    }
    
    currentHighlightedWord = null;
    wordBoundaries = [];
    
    // Restore original content
    if (currentLesson) {
        const contentElement = document.getElementById('readAloudContent');
        if (contentElement) {
            contentElement.innerHTML = `<pre class="whitespace-pre-wrap">${currentLesson.content}</pre>`;
        }
    }
}

// Speech timing variables
let speechStartTime = 0;
let estimatedDuration = 0;

// Initialize language options for translation
function initLanguageOptions() {
    const languages = [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
        { code: 'it', name: 'Italian' },
        { code: 'pt', name: 'Portuguese' },
        { code: 'ru', name: 'Russian' },
        { code: 'zh', name: 'Chinese' },
        { code: 'ja', name: 'Japanese' },
        { code: 'ko', name: 'Korean' },
        { code: 'ar', name: 'Arabic' },
        { code: 'hi', name: 'Hindi' }
    ];
    
    const sourceLanguage = document.getElementById('sourceLanguage');
    const targetLanguage = document.getElementById('targetLanguage');
    
    // Add languages to source dropdown (excluding auto-detect)
    languages.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang.code;
        option.textContent = lang.name;
        sourceLanguage.appendChild(option);
    });
    
    // Add languages to target dropdown
    languages.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang.code;
        option.textContent = lang.name;
        targetLanguage.appendChild(option);
    });
    
    // Apply saved user preferences
    applyUserPreferences();
    
    // Add event listener for target language changes
    targetLanguage.addEventListener('change', function() {
        userPreferences.targetLanguage = this.value;
        saveUserPreferences();
        
        // Automatically restart translation when target language changes
        if (currentLesson && document.getElementById('translatedText').innerHTML.trim() !== '') {
            translateContent();
        }
    });
}

// Update translate section
function updateTranslateSection() {
    const titleElement = document.getElementById('translateLessonTitle');
    const originalTextElement = document.getElementById('originalText');
    const translateBtn = document.getElementById('translateBtn');
    
    if (!currentLesson) {
        titleElement.textContent = 'No lesson loaded';
        originalTextElement.innerHTML = '<p class="text-gray-500 text-center">No lesson content available</p>';
        translateBtn.disabled = true;
        return;
    }
    
    titleElement.textContent = currentLesson.title;
    originalTextElement.innerHTML = `<pre class="whitespace-pre-wrap">${currentLesson.content}</pre>`;
    translateBtn.disabled = false;
    
    // Setup text selection for translation
    setupTextSelection();
}

// Translate content
async function translateContent() {
    console.log('translateContent function called');
    
    if (!currentLesson) {
        console.log('No current lesson');
        return;
    }
    
    const sourceLanguage = document.getElementById('sourceLanguage').value;
    const targetLanguage = document.getElementById('targetLanguage').value;
    const translationMode = document.querySelector('input[name="translationMode"]:checked').value;
    const translatedTextElement = document.getElementById('translatedText');
    const translateBtn = document.getElementById('translateBtn');
    
    console.log('Translation settings:', { sourceLanguage, targetLanguage, translationMode });
    console.log('Elements found:', { translatedTextElement: !!translatedTextElement, translateBtn: !!translateBtn });
    
    if (targetLanguage === 'auto') {
        showMessage('translateMessage', 'Please select a target language.', 'error');
        return;
    }
    
    translateBtn.disabled = true;
    translatedTextElement.innerHTML = '<p class="text-center">Translating...</p>';
    
    try {
        let textToTranslate = currentLesson.content;
        
        // Clear any selected text when doing full translation
        userPreferences.selectedText = null;
        saveUserPreferences();
        
        console.log('Text to translate:', textToTranslate.substring(0, 100) + '...');
        
        // Split text based on translation mode
        if (translationMode === 'sentence') {
            // Normalize text: replace line breaks with spaces and clean up whitespace
            const normalizedText = textToTranslate.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
            console.log('Normalized text:', normalizedText);
            
            // Improved sentence splitting that handles various sentence endings and patterns
            const sentences = normalizedText
                .split(/(?<=[.!?])\s+(?=[A-Z])/)
                .map(s => s.trim())
                .filter(s => s.length > 0);
            
            console.log('Found sentences:', sentences.length);
            console.log('Sentences:', sentences);
            
            const translatedSentences = [];
            
            for (let i = 0; i < sentences.length; i++) {
                const sentence = sentences[i].trim();
                if (sentence) {
                    console.log(`Translating sentence ${i + 1}:`, sentence.substring(0, 50) + '...');
                    try {
                        const translated = await translateText(sentence, sourceLanguage, targetLanguage);
                        translatedSentences.push(translated);
                        console.log(`Translated sentence ${i + 1}:`, translated.substring(0, 50) + '...');
                    } catch (error) {
                        console.error(`Error translating sentence ${i + 1}:`, error);
                        translatedSentences.push(sentence); // Keep original if translation fails
                    }
                }
            }
            
            textToTranslate = translatedSentences.join(' ');
        } else if (translationMode === 'paragraph') {
            const paragraphs = textToTranslate.split(/\n\s*\n/).filter(p => p.trim());
            const translatedParagraphs = [];
            
            for (const paragraph of paragraphs) {
                if (paragraph.trim()) {
                    const translated = await translateText(paragraph.trim(), sourceLanguage, targetLanguage);
                    translatedParagraphs.push(translated);
                }
            }
            
            textToTranslate = translatedParagraphs.join('\n\n');
        } else {
            // Entire lesson
            textToTranslate = await translateText(textToTranslate, sourceLanguage, targetLanguage);
        }
        
        console.log('Translation completed:', textToTranslate.substring(0, 100) + '...');
        
        translatedTextElement.innerHTML = `<pre class="whitespace-pre-wrap">${textToTranslate}</pre>`;
        console.log('Updated translatedTextElement.innerHTML:', translatedTextElement.innerHTML.substring(0, 100) + '...');
        showMessage('translateMessage', 'Translation completed successfully!', 'success');
        
        // Setup text selection for translated text
        setupTextSelection();
        
    } catch (error) {
        console.error('Translation error:', error);
        translatedTextElement.innerHTML = '<p class="text-red-500 text-center">Translation failed. Please try again.</p>';
        showMessage('translateMessage', 'Translation failed. Please check your internet connection and try again.', 'error');
    } finally {
        translateBtn.disabled = false;
    }
}

// Translate text using free translation service
async function translateText(text, sourceLang, targetLang) {
    console.log('translateText called with:', { text: text.substring(0, 50) + '...', sourceLang, targetLang });
    
    // Use free Google Translate service (no API key required)
    try {
        const fallbackUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang === 'auto' ? 'auto' : sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        
        console.log('Trying Google Translate API:', fallbackUrl.substring(0, 100) + '...');
        
        const response = await fetch(fallbackUrl);
        console.log('Google Translate response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Google Translate response data:', data);
            
            // Check if we got a valid translation
            if (data && data[0] && data[0][0] && data[0][0][0]) {
                const translatedText = data[0][0][0];
                console.log('Translated text:', translatedText);
                return translatedText;
            } else {
                console.warn('Google Translate returned incomplete data:', data);
                throw new Error('Incomplete translation response');
            }
        } else {
            throw new Error(`Translation failed: ${response.status}`);
        }
    } catch (error) {
        console.error('Google Translate error:', error);
        
        // Try alternative free translation service
        try {
            const alternativeUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang === 'auto' ? 'auto' : sourceLang}|${targetLang}`;
            
            console.log('Trying MyMemory API:', alternativeUrl.substring(0, 100) + '...');
            
            const altResponse = await fetch(alternativeUrl);
            console.log('MyMemory response status:', altResponse.status);
            
            if (altResponse.ok) {
                const altData = await altResponse.json();
                console.log('MyMemory response data:', altData);
                
                if (altData && altData.responseData && altData.responseData.translatedText) {
                    return altData.responseData.translatedText;
                } else {
                    console.warn('MyMemory returned incomplete data:', altData);
                    throw new Error('Incomplete translation response');
                }
            }
        } catch (altError) {
            console.error('MyMemory translation error:', altError);
        }
        
        throw new Error('Translation service unavailable. Please try again later.');
    }
}

// Handle text selection and highlighting
function setupTextSelection() {
    const originalTextElement = document.getElementById('originalText');
    const translatedTextElement = document.getElementById('translatedText');
    
    if (originalTextElement) {
        originalTextElement.addEventListener('click', handleTextClick);
        originalTextElement.addEventListener('mouseup', handleTextSelection);
    }
    
    if (translatedTextElement) {
        translatedTextElement.addEventListener('click', handleTextClick);
        translatedTextElement.addEventListener('mouseup', handleTextSelection);
    }
}

// Handle text click to highlight sentence
function handleTextClick(event) {
    const element = event.target;
    if (element.tagName === 'PRE') {
        const text = element.textContent;
        const clickPosition = getClickPosition(element, event);
        const sentence = findSentenceAtPosition(text, clickPosition);
        
        if (sentence) {
            // Highlight in the clicked element
            highlightSentence(element, sentence);
            
            // Also highlight the same sentence in the other text element
            const originalTextElement = document.getElementById('originalText');
            const translatedTextElement = document.getElementById('translatedText');
            
            if (element === originalTextElement && translatedTextElement) {
                // Find and highlight the same sentence in translated text
                const translatedText = translatedTextElement.textContent;
                const translatedSentence = findMatchingSentence(translatedText, sentence);
                if (translatedSentence) {
                    highlightSentence(translatedTextElement, translatedSentence);
                }
            } else if (element === translatedTextElement && originalTextElement) {
                // Find and highlight the same sentence in original text
                const originalText = originalTextElement.textContent;
                const originalSentence = findMatchingSentence(originalText, sentence);
                if (originalSentence) {
                    highlightSentence(originalTextElement, originalSentence);
                }
            }
            
            userPreferences.selectedText = sentence;
            saveUserPreferences();
        }
    }
}

// Handle text selection
function handleTextSelection() {
    const selection = window.getSelection();
    if (selection.toString().trim()) {
        const range = selection.getRangeAt(0);
        const selectedText = selection.toString();
        
        // Create a container for the highlighted text and translation button
        const container = document.createElement('span');
        container.style.display = 'inline-block';
        container.style.position = 'relative';
        
        // Create the highlighted text span
        const span = document.createElement('span');
        span.style.backgroundColor = 'yellow';
        span.style.cursor = 'pointer';
        span.textContent = selectedText;
        
        // Create the translation button
        const translateBtn = document.createElement('button');
        translateBtn.textContent = 'Translate';
        translateBtn.className = 'ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600';
        translateBtn.onclick = (e) => {
            e.stopPropagation();
            translateSelection(selectedText);
        };
        
        // Add both elements to container
        container.appendChild(span);
        container.appendChild(translateBtn);
        
        range.deleteContents();
        range.insertNode(container);
        selection.removeAllRanges();
    }
}

// Get click position in text
function getClickPosition(element, event) {
    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Simple approximation - in a real implementation, you'd use more sophisticated text measurement
    const lineHeight = 20; // Approximate line height
    const charWidth = 8; // Approximate character width
    
    const line = Math.floor(y / lineHeight);
    const char = Math.floor(x / charWidth);
    
    return { line, char };
}

// Find sentence at position
function findSentenceAtPosition(text, position) {
    const lines = text.split('\n');
    let charCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
        if (i === position.line) {
            const line = lines[i];
            const sentences = line.split(/[.!?]+/);
            let sentenceStart = 0;
            
            for (const sentence of sentences) {
                const sentenceEnd = sentenceStart + sentence.length;
                if (charCount + position.char >= sentenceStart && charCount + position.char <= sentenceEnd) {
                    return sentence.trim();
                }
                sentenceStart = sentenceEnd + 1; // +1 for the punctuation
            }
        }
        charCount += lines[i].length + 1; // +1 for newline
    }
    
    return null;
}

// Find matching sentence in text (simple implementation)
function findMatchingSentence(text, targetSentence) {
    // This is a simplified matching - in a real implementation you'd use more sophisticated matching
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    for (const sentence of sentences) {
        if (sentence.trim().length > 0) {
            return sentence.trim();
        }
    }
    return null;
}

// Highlight sentence in element
function highlightSentence(element, sentence) {
    const text = element.textContent;
    const highlightedText = text.replace(
        new RegExp(`(${sentence.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'g'),
        '<span class="bg-yellow-200 text-yellow-800 px-1 rounded">$1</span>'
    );
    element.innerHTML = highlightedText;
}

// Clear all highlights
function clearHighlights() {
    const originalTextElement = document.getElementById('originalText');
    const translatedTextElement = document.getElementById('translatedText');
    
    if (originalTextElement && currentLesson) {
        originalTextElement.innerHTML = `<pre class="whitespace-pre-wrap">${currentLesson.content}</pre>`;
    }
    
    if (translatedTextElement && translatedTextElement.textContent) {
        const text = translatedTextElement.textContent;
        translatedTextElement.innerHTML = `<pre class="whitespace-pre-wrap">${text}</pre>`;
    }
}

// Update drills section
function updateDrillsSection() {
    const titleElement = document.getElementById('drillsLessonTitle');
    const contentElement = document.getElementById('drillsContent');
    
    if (!currentLesson) {
        titleElement.textContent = 'No lesson loaded';
        contentElement.innerHTML = '<p class="text-gray-500 text-center">No lesson content available</p>';
        return;
    }
    
    titleElement.textContent = currentLesson.title;
    contentElement.innerHTML = `<pre class="whitespace-pre-wrap">${currentLesson.content}</pre>`;
}

// Update record section
function updateRecordSection() {
    const titleElement = document.getElementById('recordLessonTitle');
    
    if (!currentLesson) {
        titleElement.textContent = 'No lesson loaded';
        return;
    }
    
    titleElement.textContent = currentLesson.title;
}

// Show drill instructions
function showDrillInstructions(drillNumber) {
    // Hide all drill instructions
    const drillInstructions = ['drill1Instructions', 'drill2Instructions', 'drill3Instructions', 'drill4Instructions', 'drill5Instructions'];
    drillInstructions.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.add('hidden');
        }
    });
    
    // Show selected drill instructions
    const selectedInstructions = document.getElementById(drillNumber + 'Instructions');
    if (selectedInstructions) {
        selectedInstructions.classList.remove('hidden');
        
        // Special handling for Drill 5 - populate custom lesson text
        if (drillNumber === 'drill5' && currentLesson) {
            const customLessonText = document.getElementById('customLessonText');
            if (customLessonText) {
                customLessonText.value = currentLesson.content;
            }
        }
    }
    
    // Show general instructions
    const generalInstructions = document.getElementById('drillInstructions');
    const instructionsText = document.getElementById('drillInstructionsText');
    if (generalInstructions && instructionsText) {
        generalInstructions.classList.remove('hidden');
        switch(drillNumber) {
            case 'drill1':
                instructionsText.textContent = 'Listen to the lesson being read aloud and follow along with the text.';
                break;
            case 'drill2':
                instructionsText.textContent = 'Highlight words or phrases you don\'t understand, then translate them.';
                break;
            case 'drill3':
                instructionsText.textContent = 'Read the text aloud at the same time as the audio plays.';
                break;
            case 'drill4':
                instructionsText.textContent = 'Record yourself reading the lesson and compare with the original.';
                break;
            case 'drill5':
                instructionsText.textContent = 'Develop fluency using the fluency measurement tool.';
                break;
        }
    }
}

// Drill 1: Listen and Follow
function startDrill1() {
    if (!currentLesson) return;
    
    // Show drill 1 controls
    const drill1Instructions = document.getElementById('drill1Instructions');
    drill1Instructions.innerHTML = `
        <p>Listen to the lesson being read aloud and follow along with the text. This helps with comprehension and pronunciation.</p>
        <div class="mt-4 flex space-x-4">
            <button
                id="drill1StartBtn"
                class="px-6 py-3 btn-purple text-white rounded-md shadow transition-colors"
            >
                Start
            </button>
            <button
                id="drill1PauseBtn"
                class="px-6 py-3 btn-green text-white rounded-md shadow transition-colors"
                disabled
            >
                Pause
            </button>
            <button
                id="drill1ContinueBtn"
                class="px-6 py-3 btn-green text-white rounded-md shadow transition-colors"
                disabled
            >
                Continue
            </button>
            <button
                id="drill1StopBtn"
                class="px-6 py-3 btn-red text-white rounded-md shadow transition-colors"
                disabled
            >
                Stop
            </button>
        </div>
        <div id="drill1Content" class="mt-4 border p-4 rounded-md bg-gray-50 h-96 overflow-y-auto">
            <pre class="whitespace-pre-wrap">${currentLesson.content}</pre>
        </div>
    `;
    
    // Add event listeners for drill 1 controls
    document.getElementById('drill1StartBtn').addEventListener('click', startDrill1Reading);
    document.getElementById('drill1PauseBtn').addEventListener('click', pauseDrill1Reading);
    document.getElementById('drill1ContinueBtn').addEventListener('click', continueDrill1Reading);
    document.getElementById('drill1StopBtn').addEventListener('click', stopDrill1Reading);
}

// Drill 1 reading functions
function startDrill1Reading() {
    if (!currentLesson || !speechSynthesisSupported) return;
    
    stopDrill1Reading(); // Stop any current reading
    
    const voiceIndex = document.getElementById('voiceSelect').value;
    const rate = parseFloat(document.getElementById('rateRange').value);
    
    utterance = new SpeechSynthesisUtterance(currentLesson.content);
    
    if (voiceIndex && synth.getVoices()[voiceIndex]) {
        utterance.voice = synth.getVoices()[voiceIndex];
    }
    
    utterance.rate = rate;
    
    // Calculate estimated duration for word highlighting
    words = currentLesson.content.split(/\s+/);
    const wordsPerMinute = 120 * rate; // Reduced from 150 to 120 for more accurate timing
    estimatedDuration = (words.length / wordsPerMinute) * 60;
    speechStartTime = Date.now();
    currentWordIndex = 0; // Reset speech position
    wordBoundaries = []; // Clear previous boundaries
    
    utterance.onstart = () => {
        isPlaying = true;
        isPaused = false;
        updateDrill1Buttons();
        startDrill1WordHighlighting();
    };
    
    utterance.onend = () => {
        isPlaying = false;
        isPaused = false;
        clearDrill1WordHighlights();
        updateDrill1Buttons();
        if (isLooping) {
            setTimeout(restartDrill1Reading, 1000);
        }
    };
    
    utterance.onpause = () => {
        isPlaying = false;
        isPaused = true;
        clearDrill1WordHighlights();
        updateDrill1Buttons();
    };
    
    utterance.onresume = () => {
        isPlaying = true;
        isPaused = false;
        updateDrill1Buttons();
        startDrill1WordHighlighting();
    };
    
    synth.speak(utterance);
}

function restartDrill1Reading() {
    if (!currentLesson || !speechSynthesisSupported) return;
    
    // Don't call stopReading() to avoid interfering with loop state
    if (synth) {
        synth.cancel();
        isPlaying = false;
        clearDrill1WordHighlights();
    }
    
    const voiceIndex = document.getElementById('voiceSelect').value;
    const rate = parseFloat(document.getElementById('rateRange').value);
    
    utterance = new SpeechSynthesisUtterance(currentLesson.content);
    
    if (voiceIndex && synth.getVoices()[voiceIndex]) {
        utterance.voice = synth.getVoices()[voiceIndex];
    }
    
    utterance.rate = rate;
    
    // Calculate estimated duration for word highlighting
    words = currentLesson.content.split(/\s+/);
    const wordsPerMinute = 120 * rate; // Reduced from 150 to 120 for more accurate timing
    estimatedDuration = (words.length / wordsPerMinute) * 60;
    speechStartTime = Date.now();
    currentWordIndex = 0;
    wordBoundaries = [];
    
    utterance.onstart = () => {
        isPlaying = true;
        isPaused = false;
        updateDrill1Buttons();
        startDrill1WordHighlighting();
    };
    
    utterance.onend = () => {
        isPlaying = false;
        isPaused = false;
        clearDrill1WordHighlights();
        updateDrill1Buttons();
        if (isLooping) {
            setTimeout(restartDrill1Reading, 1000);
        }
    };
    
    utterance.onpause = () => {
        isPlaying = false;
        isPaused = true;
        clearDrill1WordHighlights();
        updateDrill1Buttons();
    };
    
    utterance.onresume = () => {
        isPlaying = true;
        isPaused = false;
        updateDrill1Buttons();
        startDrill1WordHighlighting();
    };
    
    synth.speak(utterance);
}

function pauseDrill1Reading() {
    if (synth && isPlaying) {
        synth.pause();
        isPlaying = false;
        isPaused = true;
        // Store current word position when paused
        pausedWordIndex = currentHighlightedWord;
        // Track pause start time
        pauseStartTime = Date.now();
        // Don't clear highlights - just pause them
        if (highlightInterval) {
            clearInterval(highlightInterval);
            highlightInterval = null;
        }
        updateDrill1Buttons();
    }
}

function continueDrill1Reading() {
    if (synth && isPaused && utterance) {
        synth.resume();
        isPlaying = true;
        isPaused = false;
        updateDrill1Buttons();
        // Resume highlighting from stored position
        resumeDrill1WordHighlightingFromPause();
    }
}

function stopDrill1Reading() {
    if (synth) {
        synth.cancel();
        isPlaying = false;
        clearDrill1WordHighlights();
        updateDrill1Buttons();
    }
}

function updateDrill1Buttons() {
    document.getElementById('drill1StartBtn').disabled = isPlaying || isPaused;
    document.getElementById('drill1PauseBtn').disabled = !isPlaying;
    document.getElementById('drill1ContinueBtn').disabled = !isPaused;
    document.getElementById('drill1StopBtn').disabled = !isPlaying && !isPaused;
}

function startDrill1WordHighlighting() {
    if (!currentLesson || !isPlaying) return;
    
    // Clear any existing highlights
    clearDrill1WordHighlights();
    
    // Create word boundaries for highlighting
    wordBoundaries = [];
    let currentPos = 0;
    words.forEach((word, index) => {
        const wordStart = currentLesson.content.indexOf(word, currentPos);
        const wordEnd = wordStart + word.length;
        wordBoundaries.push({
            word: word,
            start: wordStart,
            end: wordEnd,
            index: index
        });
        currentPos = wordEnd;
    });
    
    // Start highlighting words based on speech timing with stable timing
    highlightInterval = setInterval(() => {
        if (!isPlaying) {
            clearDrill1WordHighlights();
            return;
        }
        
        // Calculate word position based on speech progress
        // Use stable timing to prevent oscillation
        const elapsedTime = Date.now() - speechStartTime;
        const timingFactor = 1.6; // Fixed speed up factor - balanced highlighting
        
        // Simple forward progression without complex adaptation
        const adjustedElapsedTime = elapsedTime * timingFactor;
        const progress = adjustedElapsedTime / (estimatedDuration * 1000);
        const targetWordIndex = Math.floor(progress * words.length);
        
        if (targetWordIndex !== currentHighlightedWord && targetWordIndex < words.length) {
            // Remove previous highlight
            if (currentHighlightedWord !== null) {
                removeDrill1WordHighlight(currentHighlightedWord);
            }
            
            // Add new highlight
            currentHighlightedWord = targetWordIndex;
            addDrill1WordHighlight(targetWordIndex);
        }
    }, 50); // Update more frequently for smoother highlighting
}

// Resume highlighting from current position (for pause/continue) - Drill 1
function resumeDrill1WordHighlighting() {
    if (!currentLesson || !isPlaying) return;
    
    // Create word boundaries if they don't exist
    if (wordBoundaries.length === 0) {
        let currentPos = 0;
        words.forEach((word, index) => {
            const wordStart = currentLesson.content.indexOf(word, currentPos);
            const wordEnd = wordStart + word.length;
            wordBoundaries.push({
                word: word,
                start: wordStart,
                end: wordEnd,
                index: index
            });
            currentPos = wordEnd;
        });
    }
    
    // Resume highlighting from current position with stable timing
    highlightInterval = setInterval(() => {
        if (!isPlaying) {
            clearDrill1WordHighlights();
            return;
        }
        
        // Calculate word position based on speech progress
        // Use stable timing to prevent oscillation
        const elapsedTime = Date.now() - speechStartTime;
        const timingFactor = 1.6; // Fixed speed up factor - balanced highlighting
        
        // Simple forward progression without complex adaptation
        const adjustedElapsedTime = elapsedTime * timingFactor;
        const progress = adjustedElapsedTime / (estimatedDuration * 1000);
        const targetWordIndex = Math.floor(progress * words.length);
        
        if (targetWordIndex !== currentHighlightedWord && targetWordIndex < words.length) {
            // Remove previous highlight
            if (currentHighlightedWord !== null) {
                removeDrill1WordHighlight(currentHighlightedWord);
            }
            
            // Add new highlight
            currentHighlightedWord = targetWordIndex;
            addDrill1WordHighlight(targetWordIndex);
        }
    }, 50); // Update more frequently for smoother highlighting
}

// Resume highlighting from paused position (for pause/continue) - Drill 1
function resumeDrill1WordHighlightingFromPause() {
    if (!currentLesson || !isPlaying) return;
    
    // Create word boundaries if they don't exist
    if (wordBoundaries.length === 0) {
        let currentPos = 0;
        words.forEach((word, index) => {
            const wordStart = currentLesson.content.indexOf(word, currentPos);
            const wordEnd = wordStart + word.length;
            wordBoundaries.push({
                word: word,
                start: wordStart,
                end: wordEnd,
                index: index
            });
            currentPos = wordEnd;
        });
    }
    
    // Start from the paused position if available
    if (pausedWordIndex !== null && pausedWordIndex >= 0) {
        currentHighlightedWord = pausedWordIndex;
        // Highlight the word at the paused position
        addDrill1WordHighlight(pausedWordIndex);
    }
    
    // Resume highlighting with very conservative timing to prevent jumping ahead
    highlightInterval = setInterval(() => {
        if (!isPlaying) {
            clearDrill1WordHighlights();
            return;
        }
        
        // Use very conservative timing after pause to prevent jumping ahead
        const elapsedTime = Date.now() - speechStartTime;
        const timingFactor = 0.8; // Much slower timing after pause
        
        // Simple forward progression with conservative timing
        const adjustedElapsedTime = elapsedTime * timingFactor;
        const progress = adjustedElapsedTime / (estimatedDuration * 1000);
        const targetWordIndex = Math.floor(progress * words.length);
        
        // Ensure we don't go backwards from paused position
        const minWordIndex = pausedWordIndex !== null ? pausedWordIndex : 0;
        const finalTargetIndex = Math.max(targetWordIndex, minWordIndex);
        
        if (finalTargetIndex !== currentHighlightedWord && finalTargetIndex < words.length) {
            // Remove previous highlight
            if (currentHighlightedWord !== null) {
                removeDrill1WordHighlight(currentHighlightedWord);
            }
            
            // Add new highlight
            currentHighlightedWord = finalTargetIndex;
            addDrill1WordHighlight(finalTargetIndex);
        }
    }, 50); // Update more frequently for smoother highlighting
}

function addDrill1WordHighlight(wordIndex) {
    const contentElement = document.getElementById('drill1Content');
    if (!contentElement || wordIndex >= wordBoundaries.length) return;
    
    const boundary = wordBoundaries[wordIndex];
    const content = currentLesson.content;
    
    // Create highlighted version
    const before = content.substring(0, boundary.start);
    const word = content.substring(boundary.start, boundary.end);
    const after = content.substring(boundary.end);
    
    contentElement.innerHTML = `<pre class="whitespace-pre-wrap">${before}<span class="bg-green-300 text-green-800 px-1 rounded">${word}</span>${after}</pre>`;
}

function removeDrill1WordHighlight(wordIndex) {
    const contentElement = document.getElementById('drill1Content');
    if (!contentElement || wordIndex >= wordBoundaries.length) return;
    
    const boundary = wordBoundaries[wordIndex];
    const content = currentLesson.content;
    
    // Remove highlight by restoring original text
    const before = content.substring(0, boundary.start);
    const word = content.substring(boundary.start, boundary.end);
    const after = content.substring(boundary.end);
    
    contentElement.innerHTML = `<pre class="whitespace-pre-wrap">${before}${word}${after}</pre>`;
}

function clearDrill1WordHighlights() {
    if (highlightInterval) {
        clearInterval(highlightInterval);
        highlightInterval = null;
    }
    
    currentHighlightedWord = null;
    wordBoundaries = [];
    
    // Restore original content
    if (currentLesson) {
        const contentElement = document.getElementById('drill1Content');
        if (contentElement) {
            contentElement.innerHTML = `<pre class="whitespace-pre-wrap">${currentLesson.content}</pre>`;
        }
    }
}

// Drill 2: Highlight and Translate
let highlightingEnabled = false;

function enableTextHighlighting() {
    highlightingEnabled = !highlightingEnabled;
    const button = document.getElementById('highlightTextBtn');
    const content = document.getElementById('drillsContent');
    
    if (highlightingEnabled) {
        button.textContent = 'Disable Highlighting';
        content.style.cursor = 'text';
        content.addEventListener('mouseup', handleTextSelection);
    } else {
        button.textContent = 'Highlight Text';
        content.style.cursor = 'default';
        content.removeEventListener('mouseup', handleTextSelection);
    }
}

function handleTextSelection() {
    const selection = window.getSelection();
    if (selection.toString().trim()) {
        const range = selection.getRangeAt(0);
        const selectedText = selection.toString();
        
        // Create a container for the highlighted text and translation button
        const container = document.createElement('span');
        container.style.display = 'inline-block';
        container.style.position = 'relative';
        
        // Create the highlighted text span
        const span = document.createElement('span');
        span.style.backgroundColor = 'yellow';
        span.style.cursor = 'pointer';
        span.textContent = selectedText;
        
        // Create the translation button
        const translateBtn = document.createElement('button');
        translateBtn.textContent = 'Translate';
        translateBtn.className = 'ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600';
        translateBtn.onclick = (e) => {
            e.stopPropagation();
            translateSelection(selectedText);
        };
        
        // Add both elements to container
        container.appendChild(span);
        container.appendChild(translateBtn);
        
        range.deleteContents();
        range.insertNode(container);
        selection.removeAllRanges();
    }
}

async function translateSelection(text) {
    try {
        const targetLanguage = userPreferences.targetLanguage || 'en';
        const translated = await translateText(text, 'auto', targetLanguage);
        
        // Remove any existing translation popup
        if (currentTranslationPopup) {
            currentTranslationPopup.remove();
        }
        
        // Show translation in a larger, permanent popup
        const translationDiv = document.createElement('div');
        translationDiv.className = 'fixed top-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-6 max-w-md z-50';
        translationDiv.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h4 class="font-semibold text-lg">Translation</h4>
                <button onclick="clearTranslationPopup()" class="text-gray-500 hover:text-gray-700 text-xl font-bold">×</button>
            </div>
            <div class="mb-4">
                <h5 class="font-medium text-sm text-gray-600 mb-2">Original Text:</h5>
                <p class="text-sm bg-gray-100 p-3 rounded border">${text}</p>
            </div>
            <div class="mb-4">
                <h5 class="font-medium text-sm text-gray-600 mb-2">Translation:</h5>
                <p class="text-base font-medium bg-blue-50 p-3 rounded border">${translated}</p>
            </div>
            <div class="flex justify-end">
                <button onclick="clearTranslationPopup()" class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors">
                    Clear
                </button>
            </div>
        `;
        document.body.appendChild(translationDiv);
        currentTranslationPopup = translationDiv;
        
    } catch (error) {
        alert('Translation failed. Please try again.');
    }
}

function clearTranslationPopup() {
    if (currentTranslationPopup) {
        currentTranslationPopup.remove();
        currentTranslationPopup = null;
    }
}

function clearHighlights() {
    const content = document.getElementById('drillsContent');
    const highlights = content.querySelectorAll('span[style*="background-color: yellow"]');
    highlights.forEach(highlight => {
        const text = highlight.textContent;
        highlight.parentNode.replaceChild(document.createTextNode(text), highlight);
    });
}

// Drill 3: Read and Speak Simultaneously
function startDrill3() {
    if (!currentLesson) return;
    
    // Show drill 3 controls
    const drill3Instructions = document.getElementById('drill3Instructions');
    drill3Instructions.innerHTML = `
        <p>Read the text aloud at the same time as the audio plays. This helps develop fluency and natural rhythm.</p>
        <div class="mt-4 flex space-x-4">
            <button
                id="drill3StartBtn"
                class="px-6 py-3 btn-green text-white rounded-md shadow transition-colors"
            >
                Start
            </button>
            <button
                id="drill3PauseBtn"
                class="px-6 py-3 btn-green text-white rounded-md shadow transition-colors"
                disabled
            >
                Pause
            </button>
            <button
                id="drill3ContinueBtn"
                class="px-6 py-3 btn-green text-white rounded-md shadow transition-colors"
                disabled
            >
                Continue
            </button>
            <button
                id="drill3StopBtn"
                class="px-6 py-3 btn-red text-white rounded-md shadow transition-colors"
                disabled
            >
                Stop
            </button>
        </div>
        <div id="drill3Content" class="mt-4 border p-4 rounded-md bg-gray-50 h-96 overflow-y-auto">
            <pre class="whitespace-pre-wrap">${currentLesson.content}</pre>
        </div>
    `;
    
    // Add event listeners for drill 3 controls
    document.getElementById('drill3StartBtn').addEventListener('click', startDrill3Reading);
    document.getElementById('drill3PauseBtn').addEventListener('click', pauseDrill3Reading);
    document.getElementById('drill3ContinueBtn').addEventListener('click', continueDrill3Reading);
    document.getElementById('drill3StopBtn').addEventListener('click', stopDrill3Reading);
}

// Drill 3 reading functions (same as Drill 1 but with different content element)
function startDrill3Reading() {
    if (!currentLesson || !speechSynthesisSupported) return;
    
    stopDrill3Reading(); // Stop any current reading
    
    const voiceIndex = document.getElementById('voiceSelect').value;
    const rate = parseFloat(document.getElementById('rateRange').value);
    
    utterance = new SpeechSynthesisUtterance(currentLesson.content);
    
    if (voiceIndex && synth.getVoices()[voiceIndex]) {
        utterance.voice = synth.getVoices()[voiceIndex];
    }
    
    utterance.rate = rate;
    
    // Calculate estimated duration for word highlighting
    words = currentLesson.content.split(/\s+/);
    const wordsPerMinute = 120 * rate; // Reduced from 150 to 120 for more accurate timing
    estimatedDuration = (words.length / wordsPerMinute) * 60;
    speechStartTime = Date.now();
    currentWordIndex = 0; // Reset speech position
    wordBoundaries = []; // Clear previous boundaries
    
    utterance.onstart = () => {
        isPlaying = true;
        isPaused = false;
        updateDrill3Buttons();
        startDrill3WordHighlighting();
    };
    
    utterance.onend = () => {
        isPlaying = false;
        isPaused = false;
        clearDrill3WordHighlights();
        updateDrill3Buttons();
        if (isLooping) {
            setTimeout(restartDrill3Reading, 1000);
        }
    };
    
    utterance.onpause = () => {
        isPlaying = false;
        isPaused = true;
        clearDrill3WordHighlights();
        updateDrill3Buttons();
    };
    
    utterance.onresume = () => {
        isPlaying = true;
        isPaused = false;
        updateDrill3Buttons();
        startDrill3WordHighlighting();
    };
    
    synth.speak(utterance);
}

function restartDrill3Reading() {
    if (!currentLesson || !speechSynthesisSupported) return;
    
    // Don't call stopReading() to avoid interfering with loop state
    if (synth) {
        synth.cancel();
        isPlaying = false;
        isPaused = false; // Reset isPaused on restart
        clearDrill3WordHighlights();
    }
    
    const voiceIndex = document.getElementById('voiceSelect').value;
    const rate = parseFloat(document.getElementById('rateRange').value);
    
    utterance = new SpeechSynthesisUtterance(currentLesson.content);
    
    if (voiceIndex && synth.getVoices()[voiceIndex]) {
        utterance.voice = synth.getVoices()[voiceIndex];
    }
    
    utterance.rate = rate;
    
    // Calculate estimated duration for word highlighting
    words = currentLesson.content.split(/\s+/);
    const wordsPerMinute = 120 * rate; // Reduced from 150 to 120 for more accurate timing
    estimatedDuration = (words.length / wordsPerMinute) * 60;
    speechStartTime = Date.now();
    currentWordIndex = 0;
    wordBoundaries = [];
    
    utterance.onstart = () => {
        isPlaying = true;
        isPaused = false;
        updateDrill3Buttons();
        startDrill3WordHighlighting();
    };
    
    utterance.onend = () => {
        isPlaying = false;
        isPaused = false;
        clearDrill3WordHighlights();
        updateDrill3Buttons();
        if (isLooping) {
            setTimeout(restartDrill3Reading, 1000);
        }
    };
    
    utterance.onpause = () => {
        isPlaying = false;
        isPaused = true;
        clearDrill3WordHighlights();
        updateDrill3Buttons();
    };
    
    utterance.onresume = () => {
        isPlaying = true;
        isPaused = false;
        updateDrill3Buttons();
        startDrill3WordHighlighting();
    };
    
    synth.speak(utterance);
}

function pauseDrill3Reading() {
    if (synth && isPlaying) {
        synth.pause();
        isPlaying = false;
        isPaused = true;
        // Store current word position when paused
        pausedWordIndex = currentHighlightedWord;
        // Don't clear highlights - just pause them
        if (highlightInterval) {
            clearInterval(highlightInterval);
            highlightInterval = null;
        }
        updateDrill3Buttons();
    }
}

function continueDrill3Reading() {
    if (synth && isPaused && utterance) {
        synth.resume();
        isPlaying = true;
        isPaused = false;
        updateDrill3Buttons();
        // Resume highlighting from stored position
        resumeDrill3WordHighlightingFromPause();
    }
}

function stopDrill3Reading() {
    if (synth) {
        synth.cancel();
        isPlaying = false;
        clearDrill3WordHighlights();
        updateDrill3Buttons();
    }
}

function updateDrill3Buttons() {
    document.getElementById('drill3StartBtn').disabled = isPlaying || isPaused;
    document.getElementById('drill3PauseBtn').disabled = !isPlaying;
    document.getElementById('drill3ContinueBtn').disabled = !isPaused;
    document.getElementById('drill3StopBtn').disabled = !isPlaying && !isPaused;
}

function startDrill3WordHighlighting() {
    if (!currentLesson || !isPlaying) return;
    
    // Clear any existing highlights
    clearDrill3WordHighlights();
    
    // Create word boundaries for highlighting
    wordBoundaries = [];
    let currentPos = 0;
    words.forEach((word, index) => {
        const wordStart = currentLesson.content.indexOf(word, currentPos);
        const wordEnd = wordStart + word.length;
        wordBoundaries.push({
            word: word,
            start: wordStart,
            end: wordEnd,
            index: index
        });
        currentPos = wordEnd;
    });
    
    // Start highlighting words based on speech timing with stable timing
    highlightInterval = setInterval(() => {
        if (!isPlaying) {
            clearDrill3WordHighlights();
            return;
        }
        
        // Calculate word position based on speech progress
        // Use stable timing to prevent oscillation
        const elapsedTime = Date.now() - speechStartTime;
        const timingFactor = 1.6; // Fixed speed up factor - balanced highlighting
        
        // Simple forward progression without complex adaptation
        const adjustedElapsedTime = elapsedTime * timingFactor;
        const progress = adjustedElapsedTime / (estimatedDuration * 1000);
        const targetWordIndex = Math.floor(progress * words.length);
        
        if (targetWordIndex !== currentHighlightedWord && targetWordIndex < words.length) {
            // Remove previous highlight
            if (currentHighlightedWord !== null) {
                removeDrill3WordHighlight(currentHighlightedWord);
            }
            
            // Add new highlight
            currentHighlightedWord = targetWordIndex;
            addDrill3WordHighlight(targetWordIndex);
        }
    }, 50); // Update more frequently for smoother highlighting
}

// Resume highlighting from current position (for pause/continue) - Drill 3
function resumeDrill3WordHighlighting() {
    if (!currentLesson || !isPlaying) return;
    
    // Create word boundaries if they don't exist
    if (wordBoundaries.length === 0) {
        let currentPos = 0;
        words.forEach((word, index) => {
            const wordStart = currentLesson.content.indexOf(word, currentPos);
            const wordEnd = wordStart + word.length;
            wordBoundaries.push({
                word: word,
                start: wordStart,
                end: wordEnd,
                index: index
            });
            currentPos = wordEnd;
        });
    }
    
    // Resume highlighting from current position with stable timing
    highlightInterval = setInterval(() => {
        if (!isPlaying) {
            clearDrill3WordHighlights();
            return;
        }
        
        // Calculate word position based on speech progress
        // Use stable timing to prevent oscillation
        const elapsedTime = Date.now() - speechStartTime;
        const timingFactor = 1.6; // Fixed speed up factor - balanced highlighting
        
        // Simple forward progression without complex adaptation
        const adjustedElapsedTime = elapsedTime * timingFactor;
        const progress = adjustedElapsedTime / (estimatedDuration * 1000);
        const targetWordIndex = Math.floor(progress * words.length);
        
        if (targetWordIndex !== currentHighlightedWord && targetWordIndex < words.length) {
            // Remove previous highlight
            if (currentHighlightedWord !== null) {
                removeDrill3WordHighlight(currentHighlightedWord);
            }
            
            // Add new highlight
            currentHighlightedWord = targetWordIndex;
            addDrill3WordHighlight(targetWordIndex);
        }
    }, 50); // Update more frequently for smoother highlighting
}

// Resume highlighting from paused position (for pause/continue) - Drill 3
function resumeDrill3WordHighlightingFromPause() {
    if (!currentLesson || !isPlaying) return;
    
    // Create word boundaries if they don't exist
    if (wordBoundaries.length === 0) {
        let currentPos = 0;
        words.forEach((word, index) => {
            const wordStart = currentLesson.content.indexOf(word, currentPos);
            const wordEnd = wordStart + word.length;
            wordBoundaries.push({
                word: word,
                start: wordStart,
                end: wordEnd,
                index: index
            });
            currentPos = wordEnd;
        });
    }
    
    // Start from the paused position if available
    if (pausedWordIndex !== null && pausedWordIndex >= 0) {
        currentHighlightedWord = pausedWordIndex;
        // Highlight the word at the paused position
        addDrill3WordHighlight(pausedWordIndex);
    }
    
    // Resume highlighting with very conservative timing to prevent jumping ahead
    highlightInterval = setInterval(() => {
        if (!isPlaying) {
            clearDrill3WordHighlights();
            return;
        }
        
        // Use very conservative timing after pause to prevent jumping ahead
        const elapsedTime = Date.now() - speechStartTime;
        const timingFactor = 0.8; // Much slower timing after pause
        
        // Simple forward progression with conservative timing
        const adjustedElapsedTime = elapsedTime * timingFactor;
        const progress = adjustedElapsedTime / (estimatedDuration * 1000);
        const targetWordIndex = Math.floor(progress * words.length);
        
        // Ensure we don't go backwards from paused position
        const minWordIndex = pausedWordIndex !== null ? pausedWordIndex : 0;
        const finalTargetIndex = Math.max(targetWordIndex, minWordIndex);
        
        if (finalTargetIndex !== currentHighlightedWord && finalTargetIndex < words.length) {
            // Remove previous highlight
            if (currentHighlightedWord !== null) {
                removeDrill3WordHighlight(currentHighlightedWord);
            }
            
            // Add new highlight
            currentHighlightedWord = finalTargetIndex;
            addDrill3WordHighlight(finalTargetIndex);
        }
    }, 50); // Update more frequently for smoother highlighting
}

function addDrill3WordHighlight(wordIndex) {
    const contentElement = document.getElementById('drill3Content');
    if (!contentElement || wordIndex >= wordBoundaries.length) return;
    
    const boundary = wordBoundaries[wordIndex];
    const content = currentLesson.content;
    
    // Create highlighted version
    const before = content.substring(0, boundary.start);
    const word = content.substring(boundary.start, boundary.end);
    const after = content.substring(boundary.end);
    
    contentElement.innerHTML = `<pre class="whitespace-pre-wrap">${before}<span class="bg-green-300 text-green-800 px-1 rounded">${word}</span>${after}</pre>`;
}

function removeDrill3WordHighlight(wordIndex) {
    const contentElement = document.getElementById('drill3Content');
    if (!contentElement || wordIndex >= wordBoundaries.length) return;
    
    const boundary = wordBoundaries[wordIndex];
    const content = currentLesson.content;
    
    // Remove highlight by restoring original text
    const before = content.substring(0, boundary.start);
    const word = content.substring(boundary.start, boundary.end);
    const after = content.substring(boundary.end);
    
    contentElement.innerHTML = `<pre class="whitespace-pre-wrap">${before}${word}${after}</pre>`;
}

function clearDrill3WordHighlights() {
    if (highlightInterval) {
        clearInterval(highlightInterval);
        highlightInterval = null;
    }
    
    currentHighlightedWord = null;
    wordBoundaries = [];
    
    // Restore original content
    if (currentLesson) {
        const contentElement = document.getElementById('drill3Content');
        if (contentElement) {
            contentElement.innerHTML = `<pre class="whitespace-pre-wrap">${currentLesson.content}</pre>`;
        }
    }
}

// Drill 4 Recording Functions
function startDrillRecording() {
    if (!recordingSupported) {
        document.getElementById('recordingWarning').classList.remove('hidden');
        return;
    }
    
    // Request microphone access
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            // Create media recorder
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            
            // Set up event listeners
            mediaRecorder.addEventListener('dataavailable', event => {
                audioChunks.push(event.data);
            });
            
            mediaRecorder.addEventListener('stop', () => {
                // Create audio blob
                audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                audioUrl = URL.createObjectURL(audioBlob);
                
                // Create audio element
                audioElement = new Audio(audioUrl);
                
                // Enable playback, save, and re-record buttons
                document.getElementById('playRecordingBtn').disabled = false;
                document.getElementById('saveDrillRecordingBtn').disabled = false;
                document.getElementById('reRecordBtn').disabled = false;
                
                // Show message
                showMessage('drillInstructions', 'Recording completed. Click "Play Recording" to listen or "Save Recording" to download.', 'success');
            });
            
            // Start recording
            mediaRecorder.start();
            isRecording = true;
            
            // Update UI
            document.getElementById('startRecordingBtn').disabled = true;
            document.getElementById('stopRecordingBtn').disabled = false;
            
            // Show recording indicator
            const recordingIndicator = document.getElementById('recordingIndicator');
            if (recordingIndicator) {
                recordingIndicator.classList.remove('hidden');
                recordingIndicator.innerHTML = '<span class="text-red-500 font-bold">🔴 RECORDING...</span>';
            }
            
            // Show message
            showMessage('drillInstructions', 'Recording started. Read the text aloud, then click "Stop Recording".', 'info');
        })
        .catch(error => {
            console.error('Error accessing microphone:', error);
            document.getElementById('recordingWarning').classList.remove('hidden');
        });
}

function stopDrillRecording() {
    if (!isRecording || !mediaRecorder) return;
    
    // Stop recording
    mediaRecorder.stop();
    isRecording = false;
    
    // Stop all tracks
    if (mediaRecorder.stream) {
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    
    // Update UI
    document.getElementById('startRecordingBtn').disabled = false;
    document.getElementById('stopRecordingBtn').disabled = true;
    
    // Hide recording indicator
    const recordingIndicator = document.getElementById('recordingIndicator');
    if (recordingIndicator) {
        recordingIndicator.classList.add('hidden');
    }
}

function playDrillRecording() {
    if (!audioElement) return;
    
    // Play the recording
    audioElement.play();
    
    // Show message
    showMessage('drillInstructions', 'Playing your recording...', 'info');
}

function saveDrillRecording() {
    if (!audioBlob) return;
    
    // Create download link
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drill_recording_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show message
    showMessage('drillInstructions', 'Recording saved successfully!', 'success');
}

function resetDrillRecording() {
    // Reset recording state
    audioChunks = [];
    audioBlob = null;
    audioUrl = null;
    audioElement = null;
    
    // Update UI
    document.getElementById('playRecordingBtn').disabled = true;
    document.getElementById('reRecordBtn').disabled = true;
    document.getElementById('startRecordingBtn').disabled = false;
    
    // Show message
    showMessage('drillInstructions', 'Ready to record again.', 'info');
}

// Main Recording Functions
function startMainRecording() {
    if (!recordingSupported) {
        document.getElementById('recordingWarning').classList.remove('hidden');
        return;
    }
    
    // Request microphone access
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            // Create media recorder
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            
            // Set up event listeners
            mediaRecorder.addEventListener('dataavailable', event => {
                audioChunks.push(event.data);
            });
            
            mediaRecorder.addEventListener('stop', () => {
                // Create audio blob
                audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                audioUrl = URL.createObjectURL(audioBlob);
                
                // Create audio element
                audioElement = new Audio(audioUrl);
                
                // Enable playback and save buttons
                document.getElementById('playMainRecordingBtn').disabled = false;
                document.getElementById('saveRecordingBtn').disabled = false;
                
                // Show message
                showMessage('contentMessage', 'Recording completed. Click "Play Recording" to listen or "Save Recording" to download.', 'success');
            });
            
            // Start recording
            mediaRecorder.start();
            isRecording = true;
            
            // Update UI
            document.getElementById('startMainRecordingBtn').disabled = true;
            document.getElementById('stopMainRecordingBtn').disabled = false;
            
            // Show recording indicator if it exists
            const recordingIndicator = document.getElementById('mainRecordingIndicator');
            if (recordingIndicator) {
                recordingIndicator.classList.remove('hidden');
                recordingIndicator.innerHTML = '<span class="text-red-500 font-bold">🔴 RECORDING...</span>';
            }
            
            // Show message
            showMessage('contentMessage', 'Recording started. Speak clearly, then click "Stop Recording".', 'info');
        })
        .catch(error => {
            console.error('Error accessing microphone:', error);
            document.getElementById('recordingWarning').classList.remove('hidden');
        });
}

function stopMainRecording() {
    if (!isRecording || !mediaRecorder) return;
    
    // Stop recording
    mediaRecorder.stop();
    isRecording = false;
    
    // Stop all tracks
    if (mediaRecorder.stream) {
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    
    // Update UI
    document.getElementById('startMainRecordingBtn').disabled = false;
    document.getElementById('stopMainRecordingBtn').disabled = true;
    
    // Hide recording indicator if it exists
    const recordingIndicator = document.getElementById('mainRecordingIndicator');
    if (recordingIndicator) {
        recordingIndicator.classList.add('hidden');
    }
}

function playMainRecording() {
    if (!audioElement) return;
    
    // Play the recording
    audioElement.play();
    
    // Show message
    showMessage('contentMessage', 'Playing your recording...', 'info');
}

function saveRecording() {
    if (!audioBlob) return;
    
    // Create download link
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recording_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show message
    showMessage('contentMessage', 'Recording saved successfully!', 'success');
} 