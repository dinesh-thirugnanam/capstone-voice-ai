"use client";

import gsap from "gsap";
import { MicIcon } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";

type Props = {
    onSend: (message: string) => void;
};

export default function ChatInput({ onSend }: Props) {
    const [input, setInput] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);

    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        const textarea = textAreaRef.current;
        if (!textarea) return;

        const maxHeight = 160;
        textarea.style.height = "auto";

        const newHeight = Math.min(textarea.scrollHeight, maxHeight);
        textarea.style.height = `${newHeight}px`;

        if (!formRef) return;
        gsap.to(formRef.current, {
            height: "auto",
            duration: 1,
            ease: "power3.out",
        });
    }, [input]);

    const handleSend = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim()) return;

        onSend(input);
        setInput("");
    };

    const startListening = () => {
        if (
            !("webkitSpeechRecognition" in window) &&
            !("SpeechRecognition" in window)
        ) {
            alert("Speech recognition not supported in this browser.");
            return;
        }

        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;

        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            setIsRecording(true);
        };

        recognition.onend = () => {
            setIsRecording(false);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
            onSend(transcript);
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    return (
        <div className="sticky bottom-2 flex gap-2 py-2 px-4 w-11/12 h-fit justify-around font-poiret bg-[#dbe0dd]/90 backdrop-blur-3xl text-black rounded-2xl z-10 drop-shadow-lg outline outline-white/30">
            <form
                ref={formRef}
                onSubmit={handleSend}
                className="flex items-center w-full gap-x-3"
            >
                <textarea
                    ref={textAreaRef}
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="focus:outline-none w-full resize-none overflow-y-auto"
                    placeholder="Type or speak..."
                />

                {/* Mic Button */}
                <button
                    type="button"
                    onClick={startListening}
                    className={`px-4 py-2 rounded-lg ${
                        isRecording
                            ? "bg-red-500 text-white animate-pulse"
                            : "bg-gray-300"
                    }`}
                >
                    <MicIcon />
                </button>

                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                    Send
                </button>
            </form>
        </div>
    );
}
