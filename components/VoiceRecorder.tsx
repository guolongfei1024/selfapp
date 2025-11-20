import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';

interface Props {
  onRecordingComplete: (blob: Blob) => void;
  isProcessing: boolean;
}

const VoiceRecorder: React.FC<Props> = ({ onRecordingComplete, isProcessing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        onRecordingComplete(blob);
        
        // Stop all tracks to release mic
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50">
      <div className={`
        relative flex items-center gap-4 p-2 rounded-full shadow-xl transition-all duration-300
        ${isRecording ? 'bg-red-50 pr-6' : 'bg-transparent'}
      `}>
        
        {/* Main Button */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`
            w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95
            ${isProcessing 
              ? 'bg-slate-400 cursor-not-allowed' 
              : isRecording 
                ? 'bg-red-500 ring-4 ring-red-200' 
                : 'bg-primary-600 hover:bg-primary-700 ring-4 ring-white'
            }
          `}
        >
          {isProcessing ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : isRecording ? (
            <Square className="w-6 h-6 fill-current" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </button>

        {/* Recording Status (Visible only when recording) */}
        {isRecording && (
          <div className="flex flex-col">
            <span className="text-red-500 font-bold text-lg font-mono">{formatTime(recordingTime)}</span>
            <span className="text-red-400 text-xs font-medium animate-pulse">Recording...</span>
          </div>
        )}

        {/* Visual Pulse Rings (Decorative) */}
        {!isRecording && !isProcessing && (
            <div className="absolute inset-0 rounded-full border-2 border-primary-500 opacity-20 animate-ping pointer-events-none w-16 h-16 ml-2 mt-2"></div>
        )}
      </div>
    </div>
  );
};

export default VoiceRecorder;
