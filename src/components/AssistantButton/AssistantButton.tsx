"use client";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

interface VoiceSettings {
  stability: number;
  similarity_boost: number;
}

interface TextToSpeechData {
  text: string;
  model_id: string;
  voice_settings: VoiceSettings;
}

const AssistantButton: React.FC = () => {
  const [mediaRecorderInitialized, setMediaRecorderInitialized] = useState<boolean>(false);
  const [audioPlaying, setAudioPlaying] = useState<boolean>(false);
  const [recording, setRecording] = useState<boolean>(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [thinking, setThinking] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<string>("gemini");
  let chunks: BlobPart[] = [];

  useEffect(() => {
    if (mediaRecorder && mediaRecorderInitialized) {
      // Additional setup if needed
    }
  }, [mediaRecorder, mediaRecorderInitialized]);

  const playAudio = async (input: string): Promise<void> => {
    if (!process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY) {
      console.error("ElevenLabs API key not configured");
      setAudioPlaying(false);
      return;
    }

    const CHUNK_SIZE = 1024;
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID}/stream`;
    
    const headers = {
      Accept: "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY,
    };
    
    const data: TextToSpeechData = {
      text: input,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.6,
        similarity_boost: 0.8,
      },
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createBufferSource();
      const audioBuffer = await response.arrayBuffer();

      audioContext.decodeAudioData(audioBuffer, (buffer) => {
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start();
        
        source.onended = () => {
          setAudioPlaying(false);
          setThinking(false);
        };
      });

    } catch (error) {
      console.error("Audio playback error:", error);
      setAudioPlaying(false);
      setThinking(false);
      toast.error("Sorry honey, I'm having trouble speaking right now 💕");
    }
  };

  const handlePlayButtonClick = (input: string): void => {
    setAudioPlaying(true);
    playAudio(input);
  };

  const startRecording = () => {
    if (mediaRecorder && mediaRecorderInitialized) {
      mediaRecorder.start();
      setRecording(true);
    }
  };

  const stopRecording = () => {
    setThinking(true);
    toast("Let me think about that, love 💭", {
      duration: 5000,
      icon: "💕",
      style: {
        borderRadius: "10px",
        background: "#1E1E1E",
        color: "#F9F9F9",
        border: "0.5px solid #3B3C3F",
        fontSize: "14px",
      },
      position: "top-right",
    });
    
    if (mediaRecorder) {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  const switchProvider = () => {
    const providers = ["gemini", "openai", "together", "groq"];
    const currentIndex = providers.indexOf(currentProvider);
    const nextProvider = providers[(currentIndex + 1) % providers.length];
    setCurrentProvider(nextProvider);
    
    toast(`Switched to ${nextProvider.charAt(0).toUpperCase() + nextProvider.slice(1)} 🤖`, {
      icon: "🔄",
      style: {
        borderRadius: "10px",
        background: "#1E1E1E",
        color: "#F9F9F9",
        border: "0.5px solid #3B3C3F",
        fontSize: "14px",
      },
      position: "top-right",
    });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* AI Provider Selector */}
      <div className="flex items-center gap-2">
        <button
          onClick={switchProvider}
          className="px-3 py-1 text-xs bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
        >
          AI: {currentProvider.charAt(0).toUpperCase() + currentProvider.slice(1)}
        </button>
      </div>

      {/* Main Voice Button */}
      <motion.div
        onClick={() => {
          if (thinking) {
            toast("Please wait for me to finish, sweetheart 💕", {
              duration: 3000,
              icon: "💖",
              style: {
                borderRadius: "10px",
                background: "#1E1E1E",
                color: "#F9F9F9",
                border: "0.5px solid #3B3C3F",
                fontSize: "14px",
              },
              position: "top-right",
            });
            return;
          }

          if (typeof window !== "undefined" && !mediaRecorderInitialized) {
            setMediaRecorderInitialized(true);

            navigator.mediaDevices
              .getUserMedia({ audio: true })
              .then((stream) => {
                const newMediaRecorder = new MediaRecorder(stream);

                newMediaRecorder.onstart = () => {
                  chunks = [];
                };

                newMediaRecorder.ondataavailable = (e) => {
                  chunks.push(e.data);
                };

                newMediaRecorder.onstop = async () => {
                  const audioBlob = new Blob(chunks, { type: "audio/webm" });

                  try {
                    const reader = new FileReader();
                    reader.readAsDataURL(audioBlob);

                    reader.onloadend = async function () {
                      const base64Audio = (reader.result as string).split(",")[1];

                      if (base64Audio) {
                        const response = await fetch("/api/speechToText", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({ audio: base64Audio }),
                        });

                        const data = await response.json();

                        if (response.status !== 200) {
                          throw new Error(data.error || `Request failed with status ${response.status}`);
                        }

                        const completion = await axios.post("/api/chat", {
                          messages: [
                            {
                              role: "user",
                              content: data.result,
                            },
                          ],
                          provider: currentProvider,
                        });

                        handlePlayButtonClick(completion.data);
                      }
                    };
                  } catch (error) {
                    console.error("Error processing audio:", error);
                    setThinking(false);
                    toast.error("Sorry honey, I didn't catch that. Can you try again? 💕");
                  }
                };

                setMediaRecorder(newMediaRecorder);
              })
              .catch((err) => {
                console.error("Error accessing microphone:", err);
                toast.error("I need access to your microphone to hear you, love 🎤");
              });
          }

          if (!mediaRecorderInitialized) {
            toast("Please allow me to hear you, darling 🎤💕", {
              duration: 5000,
              icon: "🙌",
              style: {
                borderRadius: "10px",
                background: "#1E1E1E",
                color: "#F9F9F9",
                border: "0.5px solid #3B3C3F",
                fontSize: "14px",
              },
              position: "top-right",
            });
            return;
          }

          if (!recording) {
            toast("I'm listening, sweetheart - click again to send 💕", {
              icon: "🟢",
              style: {
                borderRadius: "10px",
                background: "#1E1E1E",
                color: "#F9F9F9",
                border: "0.5px solid #3B3C3F",
                fontSize: "14px",
              },
              position: "top-right",
            });
          }

          recording ? stopRecording() : startRecording();
        }}
        className="hover:scale-105 ease-in-out duration-500 hover:cursor-pointer text-[70px]"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="rainbow-container">
          <div className="green"></div>
          <div className="pink"></div>
        </div>
      </motion.div>

      {/* Status indicator */}
      <div className="text-center text-sm text-gray-600">
        {thinking && "Thinking... 💭"}
        {recording && "Listening... 🎤"}
        {audioPlaying && "Speaking... 🗣️"}
        {!thinking && !recording && !audioPlaying && "Click to talk with Aura 💕"}
      </div>
    </div>
  );
};

export default AssistantButton;