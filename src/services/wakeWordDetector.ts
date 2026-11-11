/**
 * Local Wake-Word Detector for "Sara" / "Hey Sara"
 * Emulates Android AudioRecord on-device wake-word detection
 */

export class WakeWordDetector {
  private isListening: boolean = false;
  private recognition: any = null;
  private onWakeWordDetected: () => void;
  private onHeardText?: (text: string) => void;
  private restartTimeout: any = null;

  constructor(onWakeWordDetected: () => void, onHeardText?: (text: string) => void) {
    this.onWakeWordDetected = onWakeWordDetected;
    this.onHeardText = onHeardText;
    this.initSpeechRecognition();
  }

  private initSpeechRecognition() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not available in browser. Manual click available.');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript.trim().toLowerCase();
          if (this.onHeardText) {
            this.onHeardText(transcript);
          }

          // Check for wake words
          if (
            transcript.includes('sara') ||
            transcript.includes('sarah') ||
            transcript.includes('hey sara') ||
            transcript.includes('hey sarah') ||
            transcript.includes('ok sara') ||
            transcript.includes('okay sara')
          ) {
            console.log('Wake-word "Sara" detected locally!', transcript);
            this.onWakeWordDetected();
            break;
          }
        }
      };

      this.recognition.onerror = (e: any) => {
        if (e.error !== 'no-speech' && e.error !== 'aborted') {
          console.log('Wake word listener note:', e.error);
        }
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          // Keep persistent foreground listening alive
          clearTimeout(this.restartTimeout);
          this.restartTimeout = setTimeout(() => {
            if (this.isListening) {
              try {
                this.recognition?.start();
              } catch (err) {
                // Ignore already started
              }
            }
          }, 400);
        }
      };
    } catch (e) {
      console.warn('Could not initialize SpeechRecognition for wake word:', e);
    }
  }

  public start() {
    this.isListening = true;
    if (this.recognition) {
      try {
        this.recognition.start();
        console.log('Sara local wake-word listener started.');
      } catch (e) {
        // Already active
      }
    }
  }

  public stop() {
    this.isListening = false;
    clearTimeout(this.restartTimeout);
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
    }
  }

  public simulateWakeWord() {
    this.onWakeWordDetected();
  }
}
