"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import ChatWindow from "@/components/ChatWindow";
import ChatInput from "@/components/ChatInput";

type Message = {
  role: "user" | "assistant";
  content: string;
};

// 🔊 TTS helper
function speak(text: string) {
  if (!("speechSynthesis" in window)) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 1;
  utterance.pitch = 1;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export default function Home() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const startSession = async () => {
      const sessionResponse = await axios.post(
        "http://localhost:4000/session/start"
      );

      const id = sessionResponse.data.id;
      setSessionId(id);

      const chatResponse = await axios.post(
        `http://localhost:4000/chat/${id}`,
        { userMessage: null }
      );

      const firstMessage = chatResponse.data.assistantMessage;

      setMessages([
        { role: "assistant", content: firstMessage }
      ]);

      speak(firstMessage);
    };

    startSession();
  }, []);

  const handleSend = async (message: string) => {
    if (!sessionId) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: message }
    ]);

    const chatResponse = await axios.post(
      `http://localhost:4000/chat/${sessionId}`,
      { userMessage: message }
    );

    const assistantMessage = chatResponse.data.assistantMessage;

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: assistantMessage }
    ]);

    speak(assistantMessage);
  };

  return (
    <div className="w-screen h-screen bg-slate-50 flex items-center">
      <div className="flex flex-col h-[85vh] w-[80vw] sm:w-[60vw] md:w-[40vw] mx-auto border rounded-2xl">
        <div className="text-center p-4 border-b font-semibold bg-slate-200 text-black rounded-2xl">
          Digital Mental Health Assistant
        </div>

        <ChatWindow messages={messages} />
        <ChatInput onSend={handleSend} />
      </div>
    </div>
  );
}
