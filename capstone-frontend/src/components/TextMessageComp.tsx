"use client";
import TextMessage from "../../../shared/types/TextMessage";
import gsap from "gsap";
import React, { useEffect, useRef, useState } from "react";
import { lenisRef } from "./SmoothScroll";

type TextMessageProp = {
    message: TextMessage;
};

const TextMessageComp = ({ message }: TextMessageProp) => {
    const textRef = useRef<HTMLParagraphElement>(null);
    const revealedLength = useRef(0);
    const [visibleText, setVisibleText] = useState("");

    useEffect(() => {
        if (!textRef.current) {
            return;
        }

        const fullText = message.content;

        if (revealedLength.current >= fullText.length) return;

        const newString = message.content.slice(revealedLength.current);

        let index = 0;

        const interval = setInterval(() => {
            index++;
            setVisibleText((prev) => prev + newString[index - 1]);

            if (index >= newString.length) {
                clearInterval(interval);
            }
        }, 15);

        revealedLength.current = fullText.length;

        lenisRef.current?.resize();

        return () => clearInterval(interval);
    }, [message.content]);

    useEffect(() => {
        gsap.fromTo(
            textRef.current,
            { opacity: 0.7 },
            { opacity: 1, duration: 0.3 },
        );
    }, [visibleText]);

    const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    useEffect(() => {
        clearTimeout(resizeTimeoutRef.current!);
        resizeTimeoutRef.current = setTimeout(() => {
            lenisRef.current?.resize();
        }, 50);
    }, [visibleText]);

    return (
        <>
            <p ref={textRef}>
                {visibleText}
                {message.status === "streaming" && (
                    <span className="animate-ping">&#124;</span>
                )}
            </p>
        </>
    );
};

export default TextMessageComp;
