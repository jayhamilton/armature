import { useCallback, useEffect, useRef, useState } from 'react';

// The Web Speech API's recognition half is not in TypeScript's DOM library
// (it is still prefixed in Chromium), so only the parts used here are typed.
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

const recognitionCtor: SpeechRecognitionCtor | undefined =
  (window as unknown as { SpeechRecognition?: SpeechRecognitionCtor }).SpeechRecognition ??
  (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition;

/**
 * Voice input (speech recognition into the prompt) and read aloud (speech
 * synthesis of each finished reply), as armature-ui's AgentPanelComponent
 * does. Each is reported as unsupported when the browser lacks it, so the
 * panel can hide its button.
 *
 * @param onTranscript - called with the whole transcript so far, interim
 *   results included, so the prompt fills in while the user speaks.
 */
export function useSpeech(onTranscript: (transcript: string) => void) {
  const voiceInputSupported = !!recognitionCtor;
  const voiceOutputSupported = 'speechSynthesis' in window;

  const [listening, setListening] = useState(false);
  const [readAloud, setReadAloud] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | undefined>(undefined);
  // Read from callbacks, so they always see the latest values without being recreated.
  const onTranscriptRef = useRef(onTranscript);
  const readAloudRef = useRef(readAloud);
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    readAloudRef.current = readAloud;
  });

  const toggleListening = useCallback(() => {
    if (!recognitionCtor) return;
    if (recognitionRef.current && listening) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new recognitionCtor();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      onTranscriptRef.current(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }, [listening]);

  const toggleReadAloud = useCallback(() => {
    setReadAloud((current) => {
      if (current && voiceOutputSupported) window.speechSynthesis.cancel();
      return !current;
    });
  }, [voiceOutputSupported]);

  const speak = useCallback(
    (text: string) => {
      if (!readAloudRef.current || !voiceOutputSupported || !text) return;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    },
    [voiceOutputSupported]
  );

  /** Stops the microphone and any reply being read; the panel calls this when it closes. */
  const stopAll = useCallback(() => {
    recognitionRef.current?.stop();
    if (voiceOutputSupported) window.speechSynthesis.cancel();
  }, [voiceOutputSupported]);

  useEffect(() => stopAll, [stopAll]);

  return {
    voiceInputSupported,
    voiceOutputSupported,
    listening,
    readAloud,
    toggleListening,
    toggleReadAloud,
    speak,
    stopAll,
  };
}
