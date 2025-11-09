# Zeus Speech - Text to Speech Converter

A simple and free text-to-speech web application that reads text in multiple languages with natural-sounding female voices.

## 🌟 About the Project

This is a web application that converts any text into speech audio. You can type text in Malayalam, Hindi, English, Tamil, and many other languages, and it will read it aloud using Microsoft Edge TTS (which is completely FREE - no API keys or payment needed).

**Key Features:**
- ✅ **Completely FREE** - No API keys, no payment, no registration needed
- ✅ **Auto Language Detection** - Automatically detects which language you typed
- ✅ **Multiple Languages** - Supports 20+ languages including Indian languages
- ✅ **Female Voices** - Uses natural-sounding female voices for all languages
- ✅ **Speed Control** - Adjust reading speed from 0.5x to 2.0x
- ✅ **Modern Design** - Beautiful, responsive interface with dark mode

## 🚀 How to Use

1. **Install Python** (if not installed)
   - Download from [python.org](https://www.python.org/downloads/)
   - Make sure to check "Add Python to PATH" during installation

2. **Install Required Packages**
   - Open terminal/command prompt in the project folder
   - Run: `pip install -r requirements.txt`

3. **Run the Application**
   - Run: `python app.py`
   - Open your browser and go to: `http://127.0.0.1:5000`

4. **Use the App**
   - Type or paste your text
   - The language will automatically detect and change
   - Click "Read Text" to hear it
   - Use speed buttons to adjust reading speed

## 📦 Technologies Used

### Programming Language
- **Python 3.7+** - The main programming language used for the backend server

### Packages Used (see `requirements.txt`)

1. **Flask** - A Python web framework to create the web server
   - Used for: Creating the web server, handling API requests, serving web pages

2. **edge-tts** - Microsoft Edge Text-to-Speech library (FREE)
   - Used for: Converting text to speech audio
   - Why: Completely free, no API keys needed, supports many languages

3. **langdetect** - Language detection library
   - Used for: Automatically detecting which language the user typed
   - Works by: Analyzing the text patterns and identifying the language

### Frontend Technologies
- **HTML** - Structure of the web page
- **CSS** - Styling and design
- **JavaScript** - Making the page interactive and dynamic

## 📁 Project Structure

```
cursor_pro - Copy/
├── app.py                 # Main Python server file
├── requirements.txt        # List of Python packages needed
├── README.md              # This file - project documentation
├── templates/
│   └── index.html         # Main web page
└── static/
    ├── script.js          # JavaScript for interactivity
    └── style.css          # CSS styling
```

## 🌍 Supported Languages

- **English** (en)
- **Malayalam** (ml) - മലയാളം
- **Hindi** (hi) - हिन्दी
- **Tamil** (ta) - தமிழ்
- **Telugu** (te) - తెలుగు
- **Kannada** (kn) - ಕನ್ನಡ
- **Bengali** (bn) - বাংলা
- **Gujarati** (gu) - ગુજરાતી
- **Marathi** (mr) - मराठी
- **Punjabi** (pa) - ਪੰਜਾਬੀ
- **Urdu** (ur) - اردو
- And many more: Spanish, French, German, Italian, Portuguese, Russian, Chinese, Japanese, Korean, Arabic, etc.

## ✨ How It Works

1. **You type text** → The app automatically detects the language
2. **Language auto-selects** → The dropdown changes to the detected language
3. **You click "Read Text"** → The server converts text to speech
4. **Audio plays** → You hear the text being read aloud

**Behind the scenes:**
- Python server (Flask) receives your text
- Language is detected using `langdetect`
- Text is sent to Microsoft Edge TTS
- Audio file is generated and sent to your browser
- Browser plays the audio

## 🎯 Key Features Explained

### Auto Language Detection
- When you type text, the app automatically detects which language it is
- The language dropdown automatically changes to match
- Works for all supported languages

### Female Voices
- All languages use natural-sounding female voices by default
- Voices are provided by Microsoft Edge TTS
- No configuration needed - it just works!

### Speed Control
- Use + and - buttons to adjust reading speed
- Range: 0.5x (slow) to 2.0x (fast)
- Changes apply immediately

### Dark Mode
- Click the moon icon in the top right to toggle dark mode
- Your preference is saved automatically

## 💻 Installation in Detail

### Step 1: Install Python Packages
```bash
pip install -r requirements.txt
```

This installs:
- Flask (for web server)
- edge-tts (for text-to-speech)
- langdetect (for language detection)

### Step 2: Run the Server
```bash
python app.py
```

You should see:
```
============================================================
🎙️ Text-to-Speech Server (Edge TTS - FREE)
============================================================
✅ Edge TTS is FREE - no API keys needed!
✅ Supports Hindi, Malayalam, and many other languages
✅ Using female voices by default
============================================================
```

### Step 3: Open in Browser
- Go to: `http://127.0.0.1:5000`
- Start typing and enjoy!

## 🔧 Troubleshooting

**Problem: "No module named 'flask'"**
- Solution: Run `pip install -r requirements.txt` again

**Problem: "Port 5000 already in use"**
- Solution: Close other programs using port 5000, or change the port in `app.py`

**Problem: Language not auto-detecting**
- Solution: Make sure you typed at least 5-6 characters. Short text may not detect correctly.

**Problem: Audio not playing**
- Solution: Check browser console (F12) for errors. Make sure your internet is connected (Edge TTS needs internet).

## 📝 Notes

- **Internet Required**: Edge TTS needs internet connection to work
- **Free to Use**: No limits, no costs, no API keys needed
- **Audio Format**: Audio files are saved as MP3 format
- **Temporary Files**: Audio files are stored temporarily and cleaned up automatically

## 👨‍💻 Development

- **Backend**: Python with Flask framework
- **Frontend**: HTML, CSS, JavaScript
- **TTS Engine**: Microsoft Edge TTS (free, no API keys)
- **Language Detection**: langdetect library

## 📄 License

Free to use for personal and commercial projects.

---

**Made with ❤️ by Arun Suresh**

For issues or questions, check the browser console (F12) for error messages.
