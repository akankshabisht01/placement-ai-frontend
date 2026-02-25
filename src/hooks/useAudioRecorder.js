/**
 * useAudioRecorder Hook
 * Records audio from microphone and transcribes using Groq Whisper API
 * 
 * Features:
 * - Start/stop recording
 * - Auto-transcription on stop
 * - Loading states
 * - Error handling
 */
import { useState, useRef, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  /**
   * Start recording audio from microphone
   */
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setTranscript('');
      setAudioBlob(null);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });
      
      streamRef.current = stream;
      chunksRef.current = [];
      
      // Determine best audio format for the browser
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      
      console.log('🎤 Recording started with', mimeType);
      return true;
    } catch (err) {
      console.error('Error starting recording:', err);
      setError(err.message || 'Failed to access microphone');
      return false;
    }
  }, []);

  /**
   * Stop recording and transcribe the audio
   * @returns {Promise<string>} Transcribed text
   */
  const stopRecording = useCallback(async () => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || !isRecording) {
        resolve('');
        return;
      }
      
      mediaRecorderRef.current.onstop = async () => {
        // Create blob from recorded chunks
        const blob = new Blob(chunksRef.current, { 
          type: mediaRecorderRef.current.mimeType || 'audio/webm' 
        });
        setAudioBlob(blob);
        setIsRecording(false);
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        console.log('🎤 Recording stopped, blob size:', blob.size);
        
        // Transcribe the audio
        if (blob.size > 0) {
          const text = await transcribeAudio(blob);
          resolve(text);
        } else {
          resolve('');
        }
      };
      
      mediaRecorderRef.current.stop();
    });
  }, [isRecording]);

  /**
   * Send audio to Groq Whisper API for transcription
   */
  const transcribeAudio = async (blob) => {
    setIsTranscribing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      
      // Determine file extension from mime type
      const mimeType = blob.type || 'audio/webm';
      let extension = 'webm';
      if (mimeType.includes('mp4')) extension = 'mp4';
      else if (mimeType.includes('ogg')) extension = 'ogg';
      else if (mimeType.includes('wav')) extension = 'wav';
      
      formData.append('audio', blob, `recording.${extension}`);
      
      console.log('🎤 Sending audio for transcription...', {
        size: blob.size,
        type: blob.type,
        extension
      });
      
      const response = await fetch(`${API_BASE_URL}/api/interview/transcribe`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success && data.text) {
        console.log(`✅ Transcribed in ${data.duration_ms}ms: "${data.text}"`);
        setTranscript(data.text);
        setIsTranscribing(false);
        return data.text;
      } else {
        throw new Error(data.error || 'Transcription failed');
      }
    } catch (err) {
      console.error('Transcription error:', err);
      setError(err.message || 'Transcription failed');
      setIsTranscribing(false);
      return '';
    }
  };

  /**
   * Cancel recording without transcribing
   */
  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = () => {
        setIsRecording(false);
        setAudioBlob(null);
        chunksRef.current = [];
      };
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, [isRecording]);

  /**
   * Check if browser supports audio recording
   */
  const isSupported = useCallback(() => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  }, []);

  return {
    // State
    isRecording,
    isTranscribing,
    audioBlob,
    transcript,
    error,
    
    // Actions
    startRecording,
    stopRecording,
    cancelRecording,
    
    // Utils
    isSupported
  };
}

export default useAudioRecorder;
