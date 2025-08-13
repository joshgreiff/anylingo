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

// Recording variables
let mediaRecorder = null;
let audioChunks = [];
let audioBlob = null;
let audioUrl = null;
let audioElement = null;
let isRecording = false;
let recordingSupported = false;

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
    
    // ReadAloud controls
    document.getElementById('startReadingBtn').addEventListener('click', startReading);
    document.getElementById('pauseReadingBtn').addEventListener('click', pauseReading);
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
    document.getElementById('startRecordingBtn').addEventListener('click', startRecording);
    document.getElementById('stopRecordingBtn').addEventListener('click', stopRecording);
    document.getElementById('playRecordingBtn').addEventListener('click', playRecording);
    document.getElementById('reRecordBtn').addEventListener('click', reRecord);
    
    // Main recording controls
    document.getElementById('startMainRecordingBtn').addEventListener('click', startMainRecording);
    document.getElementById('stopMainRecordingBtn').addEventListener('click', stopMainRecording);
    document.getElementById('playMainRecordingBtn').addEventListener('click', playMainRecording);
    document.getElementById('saveRecordingBtn').addEventListener('click', saveRecording);
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

// Save lessons to localStorage
function saveLessons() {
    localStorage.setItem('lessons', JSON.stringify(lessons));
}

// Create a new lesson
function createNewLesson() {
    document.getElementById('lessonTitle').value = '';
    document.getElementById('lessonContent').value = '';
    document.getElementById('createLessonMessage').classList.add('hidden');
}

// Save the current lesson
function saveLesson() {
    const title = document.getElementById('lessonTitle').value.trim();
    const content = document.getElementById('lessonContent').value.trim();
    
    if (!title || !content) {
        showMessage('createLessonMessage', 'Please enter both title and content.', 'error');
        return;
    }
    
    // Create lesson object
    const lesson = {
        id: Date.now().toString(),
        title: title,
        content: content,
        createdAt: new Date().toISOString()
    };
    
    // Save to lessons object
    lessons[lesson.id] = lesson;
    saveLessons();
    
    // Set as current lesson
    currentLesson = lesson;
    localStorage.setItem('currentLesson', JSON.stringify(currentLesson));
    
    showMessage('createLessonMessage', 'Lesson saved successfully!', 'success');
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
        lessonItem.className = 'p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors';
        lessonItem.innerHTML = `
            <h4 class="font-semibold">${lesson.title}</h4>
            <p class="text-sm text-gray-500">${new Date(lesson.createdAt).toLocaleDateString()}</p>
        `;
        lessonItem.addEventListener('click', () => selectLesson(lesson));
        lessonsList.appendChild(lessonItem);
    });
    
    // Show current lesson if available
    if (currentLesson) {
        selectedLessonTitle.textContent = currentLesson.title;
        selectedLessonContent.innerHTML = `<pre class="whitespace-pre-wrap">${currentLesson.content}</pre>`;
    }
}

// Select a lesson
function selectLesson(lesson) {
    currentLesson = lesson;
    localStorage.setItem('currentLesson', JSON.stringify(currentLesson));
    updateAllSections();
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
    utterance.onend = () => {
        isPlaying = false;
        updateReadingButtons();
        if (isLooping) {
            setTimeout(startReading, 1000);
        }
    };
    
    synth.speak(utterance);
    isPlaying = true;
    updateReadingButtons();
}

// Pause reading
function pauseReading() {
    if (synth && isPlaying) {
        synth.pause();
        isPlaying = false;
        updateReadingButtons();
    }
}

// Stop reading
function stopReading() {
    if (synth) {
        synth.cancel();
        isPlaying = false;
        isLooping = false;
        updateReadingButtons();
        document.getElementById('loopReadingBtn').textContent = 'Loop OFF';
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
    document.getElementById('startReadingBtn').disabled = isPlaying;
    document.getElementById('pauseReadingBtn').disabled = !isPlaying;
    document.getElementById('stopReadingBtn').disabled = !isPlaying;
}

// Update rate display
function updateRate() {
    const rate = document.getElementById('rateRange').value;
    document.getElementById('rateValue').textContent = rate;
}

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
    
    // Set default target language to English
    targetLanguage.value = 'en';
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
}

// Translate content
async function translateContent() {
    if (!currentLesson) return;
    
    const sourceLanguage = document.getElementById('sourceLanguage').value;
    const targetLanguage = document.getElementById('targetLanguage').value;
    const translationMode = document.querySelector('input[name="translationMode"]:checked').value;
    const translatedTextElement = document.getElementById('translatedText');
    const translateBtn = document.getElementById('translateBtn');
    
    if (targetLanguage === 'auto') {
        showMessage('translateMessage', 'Please select a target language.', 'error');
        return;
    }
    
    translateBtn.disabled = true;
    translatedTextElement.innerHTML = '<p class="text-center">Translating...</p>';
    
    try {
        let textToTranslate = currentLesson.content;
        
        // Split text based on translation mode
        if (translationMode === 'sentence') {
            const sentences = textToTranslate.split(/[.!?]+/).filter(s => s.trim());
            const translatedSentences = [];
            
            for (const sentence of sentences) {
                if (sentence.trim()) {
                    const translated = await translateText(sentence.trim(), sourceLanguage, targetLanguage);
                    translatedSentences.push(translated);
                }
            }
            
            textToTranslate = translatedSentences.join('. ') + '.';
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
        
        translatedTextElement.innerHTML = `<pre class="whitespace-pre-wrap">${textToTranslate}</pre>`;
        showMessage('translateMessage', 'Translation completed successfully!', 'success');
        
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
    // Use free Google Translate service (no API key required)
    try {
        const fallbackUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang === 'auto' ? 'auto' : sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        
        const response = await fetch(fallbackUrl);
        if (response.ok) {
            const data = await response.json();
            return data[0][0][0];
        } else {
            throw new Error(`Translation failed: ${response.status}`);
        }
    } catch (error) {
        console.error('Translation error:', error);
        
        // Try alternative free translation service
        try {
            const alternativeUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang === 'auto' ? 'auto' : sourceLang}|${targetLang}`;
            
            const altResponse = await fetch(alternativeUrl);
            if (altResponse.ok) {
                const altData = await altResponse.json();
                return altData.responseData.translatedText;
            }
        } catch (altError) {
            console.error('Alternative translation error:', altError);
        }
        
        throw new Error('Translation service unavailable. Please try again later.');
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
    startReading();
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
        const span = document.createElement('span');
        span.style.backgroundColor = 'yellow';
        span.style.cursor = 'pointer';
        span.textContent = selection.toString();
        span.onclick = () => translateSelection(span.textContent);
        
        range.deleteContents();
        range.insertNode(span);
        selection.removeAllRanges();
    }
}

async function translateSelection(text) {
    try {
        const translated = await translateText(text, 'auto', 'en');
        alert(`Translation: ${translated}`);
    } catch (error) {
        alert('Translation failed. Please try again.');
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
    startReading();
    // Note: User should read along with the audio
}

// Drill 4: Record Yourself
function startRecording() {
    if (!recordingSupported) {
        alert('Recording is not supported in your browser.');
        return;
    }
    
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            
            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };
            
            mediaRecorder.onstop = () => {
                audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                audioUrl = URL.createObjectURL(audioBlob);
                
                document.getElementById('playRecordingBtn').disabled = false;
                document.getElementById('reRecordBtn').disabled = false;
                document.getElementById('stopRecordingBtn').disabled = true;
                document.getElementById('startRecordingBtn').disabled = false;
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event);
                alert('Recording error occurred. Please try again.');
                stopRecording();
            };
            
            mediaRecorder.start();
            isRecording = true;
            
            document.getElementById('startRecordingBtn').disabled = true;
            document.getElementById('stopRecordingBtn').disabled = false;
            document.getElementById('playRecordingBtn').disabled = true;
            document.getElementById('reRecordBtn').disabled = true;
            
            console.log('Drill recording started');
        })
        .catch(error => {
            console.error('Error accessing microphone:', error);
            alert('Error accessing microphone. Please check permissions and try again.');
        });
}

function stopRecording() {
    if (mediaRecorder && isRecording) {
        try {
            mediaRecorder.stop();
            isRecording = false;
            console.log('Drill recording stopped');
        } catch (error) {
            console.error('Error stopping drill recording:', error);
            // Force stop by stopping all tracks
            if (mediaRecorder.stream) {
                mediaRecorder.stream.getTracks().forEach(track => track.stop());
            }
            isRecording = false;
        }
    }
}

function playRecording() {
    if (audioUrl) {
        if (audioElement) {
            audioElement.pause();
        }
        
        audioElement = new Audio(audioUrl);
        audioElement.play();
    }
}

function reRecord() {
    if (audioElement) {
        audioElement.pause();
        audioElement = null;
    }
    
    if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        audioUrl = null;
    }
    
    audioBlob = null;
    
    document.getElementById('playRecordingBtn').disabled = true;
    document.getElementById('reRecordBtn').disabled = true;
}

// Update record section
function updateRecordSection() {
    const titleElement = document.getElementById('recordLessonTitle');
    const contentElement = document.getElementById('recordContent');
    const recordingWarningElement = document.getElementById('recordingWarning');
    
    if (!currentLesson) {
        titleElement.textContent = 'No lesson loaded';
        contentElement.innerHTML = '<p class="text-gray-500 text-center">No lesson content available</p>';
        return;
    }
    
    titleElement.textContent = currentLesson.title;
    contentElement.innerHTML = `<pre class="whitespace-pre-wrap">${currentLesson.content}</pre>`;
    
    // Check recording support
    if (!recordingSupported) {
        recordingWarningElement.classList.remove('hidden');
    } else {
        recordingWarningElement.classList.add('hidden');
    }
}

// Main recording functions
function startMainRecording() {
    if (!recordingSupported) {
        alert('Recording is not supported in your browser.');
        return;
    }
    
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            
            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };
            
            mediaRecorder.onstop = () => {
                audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                audioUrl = URL.createObjectURL(audioBlob);
                
                document.getElementById('playMainRecordingBtn').disabled = false;
                document.getElementById('saveRecordingBtn').disabled = false;
                document.getElementById('stopMainRecordingBtn').disabled = true;
                document.getElementById('startMainRecordingBtn').disabled = false;
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event);
                alert('Recording error occurred. Please try again.');
                stopMainRecording();
            };
            
            mediaRecorder.start();
            isRecording = true;
            
            document.getElementById('startMainRecordingBtn').disabled = true;
            document.getElementById('stopMainRecordingBtn').disabled = false;
            document.getElementById('playMainRecordingBtn').disabled = true;
            document.getElementById('saveRecordingBtn').disabled = true;
            
            console.log('Recording started');
        })
        .catch(error => {
            console.error('Error accessing microphone:', error);
            alert('Error accessing microphone. Please check permissions and try again.');
        });
}

function stopMainRecording() {
    if (mediaRecorder && isRecording) {
        try {
            mediaRecorder.stop();
            isRecording = false;
            console.log('Recording stopped');
        } catch (error) {
            console.error('Error stopping recording:', error);
            // Force stop by stopping all tracks
            if (mediaRecorder.stream) {
                mediaRecorder.stream.getTracks().forEach(track => track.stop());
            }
            isRecording = false;
        }
    }
}

function playMainRecording() {
    if (audioUrl) {
        if (audioElement) {
            audioElement.pause();
        }
        
        audioElement = new Audio(audioUrl);
        audioElement.play();
    }
}

function saveRecording() {
    if (audioBlob && currentLesson) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${currentLesson.title}_recording_${timestamp}.wav`;
        
        const link = document.createElement('a');
        link.href = audioUrl;
        link.download = filename;
        link.click();
        
        // Save recording info to localStorage
        const recordings = JSON.parse(localStorage.getItem('recordings') || '{}');
        if (!recordings[currentLesson.id]) {
            recordings[currentLesson.id] = [];
        }
        
        recordings[currentLesson.id].push({
            id: timestamp,
            filename: filename,
            createdAt: new Date().toISOString(),
            url: audioUrl
        });
        
        localStorage.setItem('recordings', JSON.stringify(recordings));
        updateRecordingsList();
    }
}

function updateRecordingsList() {
    const recordingsList = document.getElementById('recordingsList');
    const recordingsContainer = document.getElementById('recordingsContainer');
    
    if (!currentLesson) {
        recordingsList.classList.add('hidden');
        return;
    }
    
    const recordings = JSON.parse(localStorage.getItem('recordings') || '{}');
    const lessonRecordings = recordings[currentLesson.id] || [];
    
    if (lessonRecordings.length === 0) {
        recordingsContainer.innerHTML = '<p class="text-gray-500 text-center">No recordings yet</p>';
    } else {
        recordingsContainer.innerHTML = '';
        lessonRecordings.forEach(recording => {
            const recordingItem = document.createElement('div');
            recordingItem.className = 'flex items-center justify-between p-3 border-b';
            recordingItem.innerHTML = `
                <div>
                    <p class="font-semibold">${recording.filename}</p>
                    <p class="text-sm text-gray-500">${new Date(recording.createdAt).toLocaleString()}</p>
                </div>
                <div class="flex space-x-2">
                    <button onclick="playSavedRecording('${recording.url}')" class="px-3 py-1 bg-blue-500 text-white rounded text-sm">Play</button>
                    <button onclick="deleteRecording('${currentLesson.id}', '${recording.id}')" class="px-3 py-1 bg-red-500 text-white rounded text-sm">Delete</button>
                </div>
            `;
            recordingsContainer.appendChild(recordingItem);
        });
    }
    
    recordingsList.classList.remove('hidden');
}

function playSavedRecording(url) {
    if (audioElement) {
        audioElement.pause();
    }
    
    audioElement = new Audio(url);
    audioElement.play();
}

function deleteRecording(lessonId, recordingId) {
    const recordings = JSON.parse(localStorage.getItem('recordings') || '{}');
    const lessonRecordings = recordings[lessonId] || [];
    
    const recordingIndex = lessonRecordings.findIndex(r => r.id === recordingId);
    if (recordingIndex !== -1) {
        const recording = lessonRecordings[recordingIndex];
        
        // Revoke the URL to free memory
        if (recording.url) {
            URL.revokeObjectURL(recording.url);
        }
        
        lessonRecordings.splice(recordingIndex, 1);
        recordings[lessonId] = lessonRecordings;
        localStorage.setItem('recordings', JSON.stringify(recordings));
        
        updateRecordingsList();
    }
} 