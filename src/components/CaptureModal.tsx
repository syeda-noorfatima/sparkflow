import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { X, Mic, Type, Send, Square, Play, RefreshCw, Sparkles, Volume2 } from 'lucide-react';

export const CaptureModal: React.FC = () => {
  const { isCaptureModalOpen, setIsCaptureModalOpen, submitCapture, settings } = useApp();
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  const [textInput, setTextInput] = useState<string>('');

  // Voice recording state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  if (!isCaptureModalOpen) return null;

  const handleStartRecording = () => {
    setSpeechError(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError("Speech recognition is not supported in this browser.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        setRecordingSeconds(0);
        setVoiceTranscript('');
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setVoiceTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setSpeechError("Microphone permission is required for voice capture.");
        } else if (event.error !== 'no-speech') {
          setSpeechError("Microphone permission is required for voice capture.");
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition', err);
      setSpeechError("Microphone permission is required for voice capture.");
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsRecording(false);
  };

  const handleSend = () => {
    const captureText = mode === 'text' ? textInput : voiceTranscript;
    if (!captureText.trim()) return;

    submitCapture(captureText.trim(), mode, mode === 'voice' ? recordingSeconds : undefined);

    // Reset state
    setTextInput('');
    setVoiceTranscript('');
    setRecordingSeconds(0);
    setIsRecording(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0F2537]/40 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] w-full max-w-lg rounded-t-[28px] sm:rounded-[24px] p-5 shadow-2xl border border-[#E8ECEF] space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#E8ECEF]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#52CBB5]/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#0F2537]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F2537]">Brain Dump Capture</h2>
              <p className="text-xs text-[#8A99AD]">Speak or write naturally. AI organizes it.</p>
            </div>
          </div>
          <button
            onClick={() => setIsCaptureModalOpen(false)}
            className="p-2 rounded-full text-[#8A99AD] hover:bg-[#F0F4F8] hover:text-[#0F2537] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex bg-[#F0F4F8] p-1 rounded-full text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setMode('text'); setIsRecording(false); }}
            className={`flex-1 py-2 rounded-full flex items-center justify-center gap-1.5 transition-all ${
              mode === 'text' ? 'bg-[#FFFFFF] text-[#0F2537] shadow-xs' : 'text-[#6B7A90]'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>Text Entry</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('voice')}
            className={`flex-1 py-2 rounded-full flex items-center justify-center gap-1.5 transition-all ${
              mode === 'voice' ? 'bg-[#FFFFFF] text-[#0F2537] shadow-xs' : 'text-[#6B7A90]'
            }`}
          >
            <Mic className="w-4 h-4 text-[#FF6B6B]" />
            <span>Voice Record</span>
          </button>
        </div>

        {/* TEXT CAPTURE MODE */}
        {mode === 'text' && (
          <div className="space-y-3">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type anything you need to remember... e.g., 'Psychology assignment due Thursday. Call Mom Friday evening.'"
              rows={5}
              className="w-full bg-[#F6F8F9] border border-[#E8ECEF] rounded-[18px] p-4 text-sm text-[#0F2537] placeholder-[#8A99AD] focus:outline-none focus:ring-2 focus:ring-[#52CBB5] resize-none leading-relaxed"
              autoFocus
            />
          </div>
        )}

        {/* VOICE CAPTURE MODE */}
        {mode === 'voice' && (
          <div className="space-y-4 py-2 text-center">
            <div className="bg-[#F6F8F9] border border-[#E8ECEF] rounded-[20px] p-6 space-y-4">
              {/* Mic Icon & Sound Wave Visualizer */}
              <div className="relative inline-flex items-center justify-center">
                {isRecording && (
                  <div className="absolute inset-0 rounded-full bg-[#FF6B6B]/20 animate-ping" />
                )}
                <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                  isRecording ? 'bg-[#FF6B6B] text-white shadow-lg shadow-[#FF6B6B]/30' : 'bg-[#D8CEFA] text-[#0F2537]'
                }`}>
                  <Mic className="w-9 h-9" />
                </div>
              </div>

              {/* Recording Status & Timer */}
              <div>
                <p className="text-sm font-semibold text-[#0F2537]">
                  {isRecording ? "Listening to your thoughts..." : voiceTranscript ? "Recording Complete" : "Tap to start recording"}
                </p>
                <p className="text-xs text-[#8A99AD] font-mono mt-0.5">
                  00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
                </p>
              </div>

              {/* Real-time Voice Wave animation bars */}
              {isRecording && (
                <div className="flex items-center justify-center gap-1 h-6">
                  {[40, 70, 30, 90, 60, 100, 50, 80, 40].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h}%` }}
                      className="w-1.5 bg-[#FF6B6B] rounded-full animate-bounce"
                    />
                  ))}
                </div>
              )}

              {/* Error Message if speech recognition fails or is unsupported */}
              {speechError && (
                <div className="bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 text-[#FF6B6B] rounded-[14px] p-3 text-xs font-medium">
                  {speechError}
                </div>
              )}

              {/* Transcript Textarea */}
              {(voiceTranscript || isRecording) && (
                <div className="bg-[#FFFFFF] border border-[#E8ECEF] rounded-[14px] p-3 text-left space-y-1">
                  <p className="text-[11px] font-semibold text-[#8A99AD] uppercase flex items-center gap-1">
                    <Volume2 className="w-3 h-3 text-[#52CBB5]" />
                    Transcribed Speech:
                  </p>
                  <textarea
                    value={voiceTranscript}
                    onChange={(e) => setVoiceTranscript(e.target.value)}
                    placeholder={isRecording ? "Listening..." : "Transcribed text will appear here..."}
                    rows={3}
                    className="w-full bg-transparent text-xs text-[#0F2537] focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              )}

              {/* Mic Action Buttons */}
              <div className="flex items-center justify-center gap-3 pt-1">
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={handleStartRecording}
                    className="px-5 py-2.5 rounded-full bg-[#52CBB5] text-white font-semibold text-xs flex items-center gap-2 hover:bg-[#42b5a0] transition-all shadow-sm"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>{voiceTranscript ? "Record Again" : "Start Speaking"}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStopRecording}
                    className="px-5 py-2.5 rounded-full bg-[#FF6B6B] text-white font-semibold text-xs flex items-center gap-2 hover:bg-[#e05555] transition-all shadow-sm"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    <span>Stop Recording</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-[#E8ECEF]">
          <button
            type="button"
            onClick={() => setIsCaptureModalOpen(false)}
            className="px-4 py-2.5 rounded-full text-xs font-semibold text-[#8A99AD] hover:bg-[#F0F4F8] transition-all"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={mode === 'text' ? !textInput.trim() : !voiceTranscript.trim()}
            className="px-6 py-2.5 rounded-full bg-[#52CBB5] disabled:bg-[#E8ECEF] disabled:text-[#8A99AD] text-white font-semibold text-xs flex items-center gap-2 hover:bg-[#42b5a0] transition-all shadow-md shadow-[#52CBB5]/20"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Process with AI</span>
          </button>
        </div>

        {/* Offline notice */}
        {settings.offlineMode && (
          <p className="text-[11px] text-[#FF6B6B] text-center font-medium bg-[#FF6B6B]/10 p-2 rounded-xl">
            ⚡ Offline mode active: Captures will save safely to Inbox and process automatically when reconnected.
          </p>
        )}
      </div>
    </div>
  );
};
