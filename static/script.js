// Global variables
let currentAudio = null;
let isPlaying = false;
let isPaused = false;
let detectedLanguage = 'auto';
let currentSpeedIndex = 2; // Default to 1.0x (index 2)

// Speed mapping: index (0-6) to speed value
const SPEED_VALUES = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

// DOM elements
const textInput = document.getElementById('textInput');
const languageSelect = document.getElementById('language');
const speedValue = document.getElementById('speedValue');
const speedDisplay = document.getElementById('speedDisplay');
const speedDecrease = document.getElementById('speedDecrease');
const speedIncrease = document.getElementById('speedIncrease');
const speakBtn = document.getElementById('speakBtn');
const stopBtn = document.getElementById('stopBtn');
const pauseBtn = document.getElementById('pauseBtn');
const statusDiv = document.getElementById('status');
const detectedLangDiv = document.getElementById('detectedLang');
const audioPlayer = document.getElementById('audioPlayer');
const charCount = document.getElementById('charCount');
const darkModeToggle = document.getElementById('darkModeToggle');
const sizeToggle = document.getElementById('sizeToggle');
const mainContainer = document.getElementById('mainContainer');

// Update speed display
function updateSpeedDisplay() {
    const speed = SPEED_VALUES[currentSpeedIndex];
    const formattedSpeed = speed % 1 === 0 ? speed.toFixed(0) : speed.toFixed(2);
    speedValue.textContent = `${formattedSpeed}x`;
    speedDisplay.textContent = `${formattedSpeed}x`;
    
    // Disable buttons at limits
    speedDecrease.disabled = currentSpeedIndex === 0;
    speedIncrease.disabled = currentSpeedIndex === SPEED_VALUES.length - 1;
    
    // Update playback speed in real-time if playing
    if (audioPlayer && isPlaying && !isPaused) {
        audioPlayer.playbackRate = speed;
    }
}

// Speed decrease
speedDecrease.addEventListener('click', () => {
    if (currentSpeedIndex > 0) {
        currentSpeedIndex--;
        updateSpeedDisplay();
    }
});

// Speed increase
speedIncrease.addEventListener('click', () => {
    if (currentSpeedIndex < SPEED_VALUES.length - 1) {
        currentSpeedIndex++;
        updateSpeedDisplay();
    }
});

// Dark Mode Toggle
function initDarkMode() {
    const saved = localStorage.getItem('darkMode');
    const isDark = saved === 'true' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
        document.body.classList.add('dark-mode');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
}

darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    darkModeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

// Size Toggle
function initSizeToggle() {
    const saved = localStorage.getItem('compactSize');
    if (saved === 'true') {
        mainContainer.classList.add('compact');
        sizeToggle.innerHTML = '<i class="fas fa-expand-arrows-alt"></i>';
    }
}

sizeToggle.addEventListener('click', () => {
    mainContainer.classList.toggle('compact');
    const isCompact = mainContainer.classList.contains('compact');
    localStorage.setItem('compactSize', isCompact);
    sizeToggle.innerHTML = isCompact ? '<i class="fas fa-expand-arrows-alt"></i>' : '<i class="fas fa-compress-arrows-alt"></i>';
});

// Update character count
textInput.addEventListener('input', () => {
    const count = textInput.value.length;
    charCount.textContent = `${count} character${count !== 1 ? 's' : ''}`;
});

// Show selected language when dropdown is manually changed
let isAutoDetecting = false;
languageSelect.addEventListener('change', () => {
    if (isAutoDetecting) {
        // Auto-detection is updating dropdown - don't show message
        return;
    }
    
    const selectedValue = languageSelect.value;
    const selectedText = languageSelect.options[languageSelect.selectedIndex].text;
    
    if (selectedValue === 'auto') {
        detectedLangDiv.innerHTML = '';
    } else {
        detectedLangDiv.innerHTML = `<strong>Selected Language:</strong> ${selectedText} (${selectedValue})`;
    }
});

// Language detection on input
let detectTimeout;
textInput.addEventListener('input', () => {
    clearTimeout(detectTimeout);
    const text = textInput.value.trim();
    
    if (text.length > 5) {
        detectTimeout = setTimeout(() => {
            detectAndSetLanguage(text);
        }, 800);
    } else {
        // Reset to auto if text is too short
        if (languageSelect.value !== 'auto') {
            languageSelect.value = 'auto';
            languageSelect.disabled = false;
            detectedLangDiv.innerHTML = '';
        }
    }
});

// Detect language and auto-select in dropdown
async function detectAndSetLanguage(text) {
    try {
        const response = await fetch('/api/detect-language', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify({ text })
        });
        
        const data = await response.json();
        if (data.success || data.lang) {
            const langCode = data.lang || data.success ? data.lang : 'en';
            const langName = data.lang_name || 'Unknown';
            
            // Set detected language
            detectedLanguage = langCode;
            
            // Auto-select in dropdown if it exists
            if (languageSelect.querySelector(`option[value="${langCode}"]`)) {
                isAutoDetecting = true; // Flag to prevent dropdown change event from showing message
                languageSelect.value = langCode;
                isAutoDetecting = false;
                detectedLangDiv.innerHTML = `<strong>Auto-detected:</strong> ${langName} (${langCode})`;
                console.log('✅ Auto-selected language in dropdown:', langCode, langName);
            } else {
                // If language not in list, show detected but keep as auto
                languageSelect.value = 'auto';
                detectedLangDiv.innerHTML = `<strong>Detected:</strong> ${langName} (${langCode}) - Using auto`;
                console.log('⚠️ Language not in dropdown, kept as auto:', langCode);
            }
        }
    } catch (error) {
        console.error('Language detection error:', error);
    }
}

// Speak function
async function speakText() {
    const text = textInput.value.trim();
    
    if (!text) {
        updateStatus('Please enter some text first!', 'error');
        return;
    }

    // Stop any current audio
    stopAudio();

    updateStatus('Generating speech...', 'active');
    speakBtn.disabled = true;
    stopBtn.disabled = false;
    pauseBtn.disabled = false;

    try {
        // Get language (use detected if auto was selected)
        let lang = languageSelect.value;
        if (lang === 'auto' && detectedLanguage !== 'auto') {
            lang = detectedLanguage;
        }
        
        // Show language being used immediately
        const selectedLangName = languageSelect.options[languageSelect.selectedIndex].text;
        if (lang === 'auto') {
            detectedLangDiv.innerHTML = '<strong>Language:</strong> Auto-detecting...';
        } else {
            detectedLangDiv.innerHTML = `<strong>Language:</strong> ${selectedLangName} (${lang})`;
        }
        
        // Get speed value from current speed index
        const speed = SPEED_VALUES[currentSpeedIndex];

        // Disable language dropdown during reading
        languageSelect.disabled = true;

        console.log('📤 Sending request to /api/speak', { text: text.substring(0, 50), lang, speed });
        
        const response = await fetch('/api/speak', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify({
                text: text,
                lang: lang,
                speed: speed
            })
        });

        console.log('📥 Response status:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ API Error:', errorData);
            const errorMsg = errorData.error || 'Failed to generate speech. Check server console.';
            updateStatus('Error: ' + errorMsg, 'error');
            
            alert('ERROR:\n\n' + errorMsg);
            
            speakBtn.disabled = false;
            stopBtn.disabled = true;
            pauseBtn.disabled = true;
            languageSelect.disabled = false;
            detectedLangDiv.innerHTML = ''; // Clear language display on error
            return;
        }

        const data = await response.json();
        console.log('✅ API Response:', data);

        if (data.success) {
            console.log('🎵 Loading audio:', data.filename);
            
            // Update the dropdown to show the detected/used language
            // Enable dropdown first so we can update it
            languageSelect.disabled = false;
            
            if (data.lang && data.lang !== 'auto') {
                // Try to find and select the language in dropdown
                const langOption = languageSelect.querySelector(`option[value="${data.lang}"]`);
                if (langOption) {
                    languageSelect.value = data.lang;
                    console.log('✅ Updated dropdown to:', data.lang, '-', data.lang_name);
                } else {
                    console.log('⚠️ Language not found in dropdown:', data.lang);
                }
            }
            
            // Always show the language being used (from API response - most accurate)
            if (data.lang_name && data.lang) {
                detectedLangDiv.innerHTML = `<strong>Language:</strong> ${data.lang_name} (${data.lang})`;
                console.log('✅ Language displayed:', data.lang_name, data.lang);
            } else {
                // Fallback if API doesn't return language info
                const selectedLangName = languageSelect.options[languageSelect.selectedIndex].text;
                const langCode = languageSelect.value === 'auto' ? 'auto' : languageSelect.value;
                detectedLangDiv.innerHTML = `<strong>Language:</strong> ${selectedLangName} (${langCode})`;
            }

            // Load and play audio
            const audioUrl = `/api/audio/${data.filename}`;
            console.log('🎵 Audio URL:', audioUrl);
            
            // Clear previous audio
            audioPlayer.src = '';
            audioPlayer.load();
            
            // Set up audio event listeners BEFORE setting src
            audioPlayer.onloadstart = () => {
                console.log('🔄 Audio loading started...');
                updateStatus('Loading audio...', 'active');
            };
            
            audioPlayer.onloadedmetadata = () => {
                console.log('✅ Audio metadata loaded, duration:', audioPlayer.duration, 'seconds');
            };
            
            audioPlayer.onloadeddata = () => {
                console.log('✅ Audio data loaded');
            };
            
            audioPlayer.oncanplay = () => {
                console.log('✅ Audio can play');
            };
            
            audioPlayer.oncanplaythrough = () => {
                console.log('✅ Audio can play through');
            };

            audioPlayer.onplay = () => {
                console.log('▶️ Audio started playing');
                isPlaying = true;
                isPaused = false;
                updateStatus('Reading text...', 'active');
            };

            audioPlayer.onpause = () => {
                console.log('⏸️ Audio paused');
                isPaused = true;
                updateStatus('Paused', '');
            };

            audioPlayer.onended = () => {
                console.log('⏹️ Audio ended');
                isPlaying = false;
                isPaused = false;
                updateStatus('Finished reading', 'success');
                speakBtn.disabled = false;
                stopBtn.disabled = true;
                pauseBtn.disabled = true;
                languageSelect.disabled = false;
            };

            audioPlayer.onerror = (e) => {
                console.error('❌ Audio error:', e);
                console.error('❌ Audio error code:', audioPlayer.error);
                console.error('❌ Audio error message:', audioPlayer.error ? audioPlayer.error.message : 'Unknown');
                updateStatus('Error playing audio. Check console for details.', 'error');
                speakBtn.disabled = false;
                stopBtn.disabled = true;
                pauseBtn.disabled = true;
                languageSelect.disabled = false;
            };
            
            audioPlayer.onstalled = () => {
                console.warn('⚠️ Audio stalled');
            };

            // Set audio source and properties
            audioPlayer.src = audioUrl;
            audioPlayer.playbackRate = speed;
            currentAudio = audioPlayer;
            
            // Load the audio first
            audioPlayer.load();
            
            // Wait for audio to be ready, then play
            try {
                let canPlayResolve;
                let canPlayReject;
                
                const playPromise = new Promise((resolve, reject) => {
                    canPlayResolve = resolve;
                    canPlayReject = reject;
                    
                    const timeout = setTimeout(() => {
                        console.error('❌ Audio loading timeout after 10 seconds');
                        reject(new Error('Audio loading timeout - file may be empty or corrupted'));
                    }, 10000);
                    
                    const canPlayHandler = () => {
                        clearTimeout(timeout);
                        console.log('✅ Audio ready to play, duration:', audioPlayer.duration);
                        if (audioPlayer.duration === 0 || isNaN(audioPlayer.duration)) {
                            console.error('❌ Audio duration is 0 or invalid - file may be empty');
                            reject(new Error('Audio file appears to be empty (duration: 0)'));
                        } else {
                            resolve();
                        }
                        audioPlayer.removeEventListener('canplaythrough', canPlayHandler);
                        audioPlayer.removeEventListener('error', errorHandler);
                    };
                    
                    const errorHandler = () => {
                        clearTimeout(timeout);
                        const errorMsg = audioPlayer.error ? audioPlayer.error.message : 'Unknown error';
                        console.error('❌ Audio load error:', errorMsg);
                        reject(new Error('Audio load failed: ' + errorMsg));
                        audioPlayer.removeEventListener('canplaythrough', canPlayHandler);
                        audioPlayer.removeEventListener('error', errorHandler);
                    };
                    
                    audioPlayer.addEventListener('canplaythrough', canPlayHandler, { once: true });
                    audioPlayer.addEventListener('error', errorHandler, { once: true });
                });
                
                await playPromise;
                
                console.log('🎵 Playing audio now, duration:', audioPlayer.duration, 'seconds');
                
                // Check if duration is valid (Edge TTS MP3 files should have valid duration)
                // Note: MP3 files should never have Infinity duration - that was a WAV header issue
                if (isNaN(audioPlayer.duration) || audioPlayer.duration <= 0) {
                    console.error('❌ Invalid audio duration:', audioPlayer.duration);
                    throw new Error('Audio file has invalid duration - may be corrupted');
                }
                
                // Try to play
                try {
                    const playResult = await audioPlayer.play();
                    console.log('✅ Audio play() called successfully, duration:', audioPlayer.duration);
                    
                    // Verify it's actually playing
                    setTimeout(() => {
                        if (!audioPlayer.paused && audioPlayer.currentTime > 0) {
                            console.log('✅ Audio is playing correctly, current time:', audioPlayer.currentTime);
                        } else {
                            console.warn('⚠️ Audio may not be playing - paused:', audioPlayer.paused, 'currentTime:', audioPlayer.currentTime);
                        }
                    }, 500);
                } catch (playErr) {
                    // Handle autoplay policy issues
                    if (playErr.name === 'NotAllowedError') {
                        console.error('❌ Autoplay blocked - user interaction required');
                        updateStatus('Please click Play to start audio (autoplay blocked)', 'error');
                        // Show play button
                        audioPlayer.controls = true;
                        audioPlayer.style.display = 'block';
                    }
                    throw playErr;
                }
            } catch (playError) {
                console.error('❌ Play error:', playError);
                updateStatus('Error: ' + playError.message, 'error');
                speakBtn.disabled = false;
                stopBtn.disabled = true;
                pauseBtn.disabled = true;
                languageSelect.disabled = false;
            }

        } else {
            console.error('❌ API returned error:', data);
            const errorMsg = data.error || 'Error generating speech';
            updateStatus(errorMsg, 'error');
            alert('ERROR: ' + errorMsg + '\n\nPlease check:\n1. Google Cloud credentials are set\n2. Text-to-Speech API is enabled\n3. Check server console for details');
            speakBtn.disabled = false;
            stopBtn.disabled = true;
            pauseBtn.disabled = true;
            // Re-enable language dropdown on error
            languageSelect.disabled = false;
        }
    } catch (error) {
        console.error('❌ Network/Fetch Error:', error);
        updateStatus('Error: ' + error.message, 'error');
        alert('NETWORK ERROR: ' + error.message + '\n\nMake sure the Flask server is running and accessible.');
        speakBtn.disabled = false;
        stopBtn.disabled = true;
        pauseBtn.disabled = true;
        // Re-enable language dropdown on error
        languageSelect.disabled = false;
    }
}

// Stop function
function stopAudio() {
    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
    }
    isPlaying = false;
    isPaused = false;
    updateStatus('Stopped', '');
    speakBtn.disabled = false;
    stopBtn.disabled = true;
    pauseBtn.disabled = true;
    // Re-enable language dropdown when stopped
    languageSelect.disabled = false;
}

// Pause/Resume function
function togglePause() {
    if (!audioPlayer || !audioPlayer.src) return;

    if (isPaused) {
        audioPlayer.play();
        pauseBtn.innerHTML = '<span class="btn-icon">⏸</span><span>Pause</span>';
    } else {
        audioPlayer.pause();
        pauseBtn.innerHTML = '<span class="btn-icon">▶</span><span>Resume</span>';
    }
}

// Update status
function updateStatus(message, type = '') {
    statusDiv.textContent = message;
    statusDiv.className = 'status';
    if (type) {
        statusDiv.classList.add(type);
    }
}

// Event listeners
speakBtn.addEventListener('click', speakText);
stopBtn.addEventListener('click', stopAudio);
pauseBtn.addEventListener('click', togglePause);

// Allow Ctrl+Enter or Cmd+Enter to speak
textInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        speakText();
    }
});

// Initialize on page load
initDarkMode();
initSizeToggle();
updateSpeedDisplay();

// Initial character count
charCount.textContent = '0 characters';

