"use client";

import { useEffect, useRef, useState } from "react";

type Message = {
  role: "user" | "assistant";
  text: string;
};

export default function ChatDemo() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hi 👋 I’m your college support assistant. You can type or use voice to talk to me.",
    },
  ]);

  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize browser speech recognition
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      sendMessage(transcript);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    setMessages((prev) => [...prev, { role: "user", text }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.reply || "Sorry, something went wrong.",
        },
      ]);
      speak(data.reply || "Sorry, something went wrong.");
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Network error. Please try again.",
        },
      ]);
    }
  };
    useEffect(() => {
    speak(
      "Hi, I’m your college support assistant. You can type or use voice to talk to me."
    );
  }, []);


  const handleSend = async () => {
    const text = input;
    setInput("");
    await sendMessage(text);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  };

    const speak = (text: string) => {
    if (typeof window === "undefined") return;

    const synth = window.speechSynthesis;

    // Stop anything currently speaking
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;

    synth.speak(utterance);
};


  return (
    <div className="h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-[420px] h-[600px] bg-white rounded-xl shadow-xl flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b font-semibold">
          🎓 Student Support Chat
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm flex items-center gap-2 ${
              msg.role === "user"
                ? "ml-auto bg-blue-600 text-white"
                : "bg-gray-200 text-gray-900"
            }`}
          >
            <span className="flex-1">{msg.text}</span>

            {msg.role === "assistant" && (
              <button
                onClick={() => speak(msg.text)}
                className="text-xs opacity-70 hover:opacity-100"
                title="Read aloud"
              >
                🔊
              </button>
            )}
          </div>
))}

        </div>

        {/* Input */}
        <div className="p-3 border-t flex items-center gap-2">
          {/* Mic Button */}
          <button
            onClick={toggleListening}
            className={`w-11 h-11 rounded-full flex items-center justify-center text-white transition ${
              listening ? "bg-red-500 animate-pulse" : "bg-gray-900"
            }`}
          >
            🎤
          </button>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring focus:ring-blue-300"
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />

          <button
            onClick={handleSend}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
