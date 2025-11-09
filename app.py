from flask import Flask, render_template, request, jsonify, send_file
import edge_tts
import asyncio
import os
import tempfile
from langdetect import detect, LangDetectException
import time
import sys
import codecs

# Ensure UTF-8 encoding for console output on Windows
if sys.platform == 'win32':
    try:
        sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
        sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')
    except:
        pass

app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False  # Allow non-ASCII characters in JSON responses
app.config['TEMPLATES_AUTO_RELOAD'] = True  # Enable auto-reload of templates

# Language code mapping to Edge TTS language codes
LANGUAGE_CODES = {
    'en': 'en-US',
    'ml': 'ml-IN',
    'hi': 'hi-IN',
    'ta': 'ta-IN',
    'te': 'te-IN',
    'kn': 'kn-IN',
    'es': 'es-ES',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'it': 'it-IT',
    'pt': 'pt-BR',
    'ru': 'ru-RU',
    'zh': 'zh-CN',
    'ja': 'ja-JP',
    'ko': 'ko-KR',
    'ar': 'ar-SA',
    'bn': 'bn-IN',
    'gu': 'gu-IN',
    'mr': 'mr-IN',
    'pa': 'pa-IN',
    'ur': 'ur-PK',
}

# Language names for display
LANGUAGE_NAMES = {
    'en': 'English',
    'ml': 'Malayalam',
    'hi': 'Hindi',
    'ta': 'Tamil',
    'te': 'Telugu',
    'kn': 'Kannada',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'ar': 'Arabic',
    'bn': 'Bengali',
    'gu': 'Gujarati',
    'mr': 'Marathi',
    'pa': 'Punjabi',
    'ur': 'Urdu',
}

# Temporary directory for audio files
TEMP_DIR = tempfile.gettempdir()

# Cache for voices
_voices_cache = None

async def get_available_voices():
    """Get list of available Edge TTS voices"""
    global _voices_cache
    if _voices_cache is not None:
        return _voices_cache
    
    try:
        voices = await edge_tts.list_voices()
        _voices_cache = voices
        return voices
    except Exception as e:
        print(f"Error getting voices: {e}")
        return []

def get_female_voice_for_language(language_code):
    """Get a female voice for the language using Edge TTS"""
    # Edge TTS voice format: {Language}-{Country}-{Name}Neural or {Name}
    # We'll search for voices that match the language and are female
    
    # Common Edge TTS female voice patterns
    female_voice_map = {
        'en-US': 'en-US-AriaNeural',      # Female
        'hi-IN': 'hi-IN-SwaraNeural',     # Female for Hindi
        'ml-IN': 'ml-IN-SobhanaNeural',   # Female for Malayalam
        'ta-IN': 'ta-IN-PallaviNeural',   # Female for Tamil
        'te-IN': 'te-IN-MohanNeural',     # Female for Telugu
        'kn-IN': 'kn-IN-SapnaNeural',     # Female for Kannada
        'bn-IN': 'bn-IN-TanishaaNeural',  # Female for Bengali
        'gu-IN': 'gu-IN-DhwaniNeural',    # Female for Gujarati
        'mr-IN': 'mr-IN-AarohiNeural',    # Female for Marathi
        'pa-IN': 'pa-IN-GulNeural',       # Female for Punjabi
        'ur-PK': 'ur-PK-GulNeural',       # Female for Urdu
        'es-ES': 'es-ES-ElviraNeural',    # Female
        'fr-FR': 'fr-FR-DeniseNeural',    # Female
        'de-DE': 'de-DE-KatjaNeural',     # Female
        'it-IT': 'it-IT-ElsaNeural',      # Female
        'pt-BR': 'pt-BR-FranciscaNeural', # Female
        'ru-RU': 'ru-RU-SvetlanaNeural',  # Female
        'zh-CN': 'zh-CN-XiaoxiaoNeural',  # Female
        'ja-JP': 'ja-JP-NanamiNeural',    # Female
        'ko-KR': 'ko-KR-SunHiNeural',     # Female
        'ar-SA': 'ar-SA-ZariyahNeural',   # Female
    }
    
    return female_voice_map.get(language_code)

async def find_female_voice(language_code):
    """Find best female voice for the language"""
    # First try predefined voice
    predefined = get_female_voice_for_language(language_code)
    if predefined:
        voices = await get_available_voices()
        for voice in voices:
            if voice['ShortName'] == predefined or voice['Name'] == predefined:
                if 'Female' in voice.get('Gender', '') or 'F' in voice.get('Gender', ''):
                    print(f"✅ Using predefined female voice: {voice['ShortName']}")
                    return voice['ShortName']
                break
    
    # Search for any female voice in the language
    try:
        voices = await get_available_voices()
        lang_code = language_code.split('-')[0]  # Get language code (e.g., 'hi' from 'hi-IN')
        
        female_voices = []
        for voice in voices:
            voice_lang = voice.get('Locale', '').split('-')[0]
            gender = voice.get('Gender', '')
            
            if voice_lang.lower() == lang_code.lower():
                if 'Female' in gender or 'F' in gender:
                    female_voices.append(voice)
        
        if female_voices:
            # Prefer Neural voices
            for voice in female_voices:
                if 'Neural' in voice.get('ShortName', '') or 'Neural' in voice.get('Name', ''):
                    print(f"✅ Found female Neural voice: {voice['ShortName']}")
                    return voice['ShortName']
            
            # Use first female voice found
            print(f"✅ Using female voice: {female_voices[0]['ShortName']}")
            return female_voices[0]['ShortName']
        else:
            print(f"⚠️ No female voices found for {language_code}, will use any available voice")
            # Fallback to any voice in the language
            for voice in voices:
                if voice.get('Locale', '').startswith(language_code):
                    print(f"⚠️ Using voice: {voice['ShortName']}")
                    return voice['ShortName']
    except Exception as e:
        print(f"⚠️ Error finding voice: {e}")
    
    # Last resort: use predefined or English female
    if predefined:
        return predefined
    return 'en-US-AriaNeural'  # English female as fallback

async def generate_speech_edge(text, language_code, speed, output_file):
    """Generate speech using Edge TTS (FREE, no API keys needed)"""
    try:
        # Ensure text is a proper Unicode string
        if isinstance(text, bytes):
            text = text.decode('utf-8')
        elif not isinstance(text, str):
            text = str(text)
        
        # Normalize Unicode characters
        try:
            import unicodedata
            text = unicodedata.normalize('NFC', text)
        except:
            pass
        
        # Find female voice for the language
        voice_name = await find_female_voice(language_code)
        
        print(f"💬 Generating speech with Edge TTS...")
        print(f"   Language: {language_code}")
        print(f"   Voice: {voice_name} (Female)")
        print(f"   Speed: {speed}x")
        print(f"   Text length: {len(text)} characters")
        
        # Generate speech
        communicate = edge_tts.Communicate(text, voice_name, rate=f"+{int((speed - 1) * 100)}%")
        
        # Save to file
        await communicate.save(output_file)
        
        # Verify file was created and has content
        if os.path.exists(output_file):
            file_size = os.path.getsize(output_file)
            if file_size > 0:
                print(f"✓ Audio file created successfully: {file_size} bytes")
                return True, voice_name
            else:
                print(f"✗ Error: Audio file is empty (0 bytes)")
                return False, None
        else:
            print(f"✗ Error: Audio file was not created at {output_file}")
            return False, None
            
    except Exception as e:
        print(f"✗ Error in Edge TTS: {e}")
        import traceback
        traceback.print_exc()
        return False, None

@app.route('/')
def index():
    return render_template('index.html', languages=LANGUAGE_NAMES)

@app.route('/api/speak', methods=['POST'])
def speak():
    try:
        data = request.json
        text = data.get('text', '').strip()
        
        # Ensure text is UTF-8
        if isinstance(text, bytes):
            text = text.decode('utf-8')
        elif not isinstance(text, str):
            text = str(text)
        
        lang = data.get('lang', 'en')
        speed = float(data.get('speed', 1.0))
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        # Log text preview
        text_preview = text[:100] + '...' if len(text) > 100 else text
        print(f"\n{'='*60}")
        print(f"📝 New request received")
        print(f"   Text preview: {text_preview}")
        print(f"   Length: {len(text)} characters")
        
        # Auto-detect language if needed
        if lang == 'auto':
            try:
                detected = detect(text)
                lang = detected if detected in LANGUAGE_CODES else 'en'
                print(f"🌍 Auto-detected: {detected} -> {lang}")
            except LangDetectException:
                lang = 'en'
                print(f"⚠️ Language detection failed, using English")
        
        # Get language code
        language_code = LANGUAGE_CODES.get(lang, 'en-US')
        lang_name = LANGUAGE_NAMES.get(lang, lang)
        
        print(f"   Selected language: {lang_name} ({language_code})")
        
        # Generate unique filename
        filename = f"speech_{int(time.time())}_{abs(hash(text)) % 100000}.mp3"
        filepath = os.path.join(TEMP_DIR, filename)
        
        # Generate speech with FEMALE voice using Edge TTS
        print(f"🎙️ Generating speech with Edge TTS (Female voice)...")
        
        # Run async function
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        success, voice_used = loop.run_until_complete(
            generate_speech_edge(text, language_code, speed, filepath)
        )
        loop.close()
        
        # Check if generation was successful
        if not success:
            return jsonify({
                'error': 'Failed to generate speech. Please check server console for details.'
            }), 500
        
        if not os.path.exists(filepath):
            return jsonify({
                'error': 'Audio file was not created.'
            }), 500
        
        file_size = os.path.getsize(filepath)
        if file_size == 0:
            return jsonify({
                'error': 'Audio file is empty.'
            }), 500
        
        print(f"✓ File verified: {file_size} bytes")
        print(f"✓ SUCCESS: Audio generated successfully!")
        print(f"{'='*60}\n")
        
        # Return success response
        return jsonify({
            'success': True,
            'filename': filename,
            'lang': lang,
            'lang_name': lang_name,
            'voice_used': f'Edge TTS - {voice_used} (Female)'
        })
        
    except Exception as e:
        print(f"\n✗ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Error: {str(e)}'}), 500

@app.route('/api/detect-language', methods=['POST'])
def detect_language():
    """Detect language from text"""
    try:
        data = request.json
        text = data.get('text', '').strip()
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        # Ensure text is UTF-8
        if isinstance(text, bytes):
            text = text.decode('utf-8')
        
        # Auto-detect language
        try:
            detected = detect(text)
            lang = detected if detected in LANGUAGE_CODES else 'en'
            lang_name = LANGUAGE_NAMES.get(lang, lang)
            
            return jsonify({
                'success': True,
                'lang': lang,
                'lang_name': lang_name
            })
        except LangDetectException:
            return jsonify({
                'success': False,
                'lang': 'en',
                'lang_name': 'English'
            })
            
    except Exception as e:
        print(f"Error detecting language: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/audio/<filename>')
def get_audio(filename):
    try:
        filepath = os.path.join(TEMP_DIR, filename)
        if os.path.exists(filepath):
            mimetype = 'audio/mpeg' if filename.endswith('.mp3') else 'audio/wav'
            return send_file(filepath, mimetype=mimetype)
        else:
            return jsonify({'error': 'Audio file not found'}), 404
    except Exception as e:
        print(f"Error serving audio: {e}")
        return jsonify({'error': 'Error serving audio file'}), 500

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🎙️ Text-to-Speech Server (Edge TTS - FREE)")
    print("="*60)
    print("✅ Edge TTS is FREE - no API keys needed!")
    print("✅ Supports Hindi, Malayalam, and many other languages")
    print("✅ Using female voices by default")
    print("="*60 + "\n")
    app.run(debug=True, host='127.0.0.1', port=5000)