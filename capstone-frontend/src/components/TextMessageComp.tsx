"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import TextMessage from "../../../shared/types/TextMessage";
import { lenisRef } from "./SmoothScroll";

type TextMessageProp = {
    message?: TextMessage; // message may be undefined
};

const TextMessageComp = ({ message }: TextMessageProp) => {
    const textRef = useRef<HTMLParagraphElement>(null);
    const [visibleText, setVisibleText] = useState("");

    const revealIndexRef = useRef(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const fullText = message?.content ?? ""; // safe fallback

    useEffect(() => {
        // Clear previous interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        setVisibleText(""); // reset visible text
        revealIndexRef.current = 0;

        if (!fullText) return; // no text to reveal

        intervalRef.current = setInterval(() => {
            if (revealIndexRef.current < fullText.length) {
                const nextChar = fullText[revealIndexRef.current];
                setVisibleText((prev) => prev + nextChar);
                revealIndexRef.current += 1;
            } else {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
            }

            lenisRef.current?.resize();
        }, 15);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [fullText]);

    // GSAP fade-in
    useEffect(() => {
        if (textRef.current) {
            gsap.fromTo(
                textRef.current,
                { opacity: 0.7 },
                { opacity: 1, duration: 0.3 },
            );
        }
    }, [visibleText]);

    // Lenis resize after rendering
    useEffect(() => {
        const timeout = setTimeout(() => {
            lenisRef.current?.resize();
        }, 50);
        return () => clearTimeout(timeout);
    }, [visibleText]);

    // Instead of returning null, render empty placeholder so layout stays
    return (
        <p
            ref={textRef}
            className="break-words whitespace-pre-wrap min-h-[1em]"
        >
            {visibleText}
            {message?.status === "streaming" && (
                <span className="animate-ping">&#124;</span>
            )}
        </p>
    );
};

export default TextMessageComp;
