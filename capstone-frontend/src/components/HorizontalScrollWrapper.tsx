"use client";

import React, { useEffect, useRef, useState } from "react";

interface HorizontalScrollWrapperProps {
    /** Width of the scroll wrapper (container) */
    width?: number;
    /** Height of the custom scrollbar track */
    scrollbarHeight?: number;
    /** Optional styling for the track */
    trackColor?: string;
    /** Thumb color */
    thumbColor?: string;
    /** Thumb border radius */
    borderRadius?: number;
    /** Optional style for wrapper positioning */
    style?: React.CSSProperties;
    children: React.ReactNode;
}

const HorizontalScrollWrapper: React.FC<HorizontalScrollWrapperProps> = ({
    children,
    width = 300,
    scrollbarHeight = 6,
    trackColor = "#ddd",
    thumbColor = "#666",
    borderRadius = 4,
    style,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const thumbRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState(false);

    // Update thumb position and width
    const updateThumb = () => {
        const container = containerRef.current;
        const thumb = thumbRef.current;
        const track = trackRef.current;
        if (!container || !thumb || !track) return;

        const visibleRatio = container.clientWidth / container.scrollWidth;
        thumb.style.width = `${Math.max(visibleRatio * track.clientWidth, 20)}px`; // min 20px

        const scrollRatio =
            container.scrollLeft /
            (container.scrollWidth - container.clientWidth);
        const maxThumbMove = track.clientWidth - thumb.clientWidth;
        thumb.style.left = `${scrollRatio * maxThumbMove}px`;
    };

    // Sync thumb on scroll
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener("scroll", updateThumb);
        window.addEventListener("resize", updateThumb);
        updateThumb();

        return () => {
            container.removeEventListener("scroll", updateThumb);
            window.removeEventListener("resize", updateThumb);
        };
    }, []);

    // Drag logic
    const onMouseMove = (e: MouseEvent) => {
        if (!dragging) return;
        const container = containerRef.current;
        const thumb = thumbRef.current;
        const track = trackRef.current;
        if (!container || !thumb || !track) return;

        const rect = track.getBoundingClientRect();
        let x = e.clientX - rect.left;
        x = Math.max(0, Math.min(x, track.clientWidth - thumb.clientWidth));

        const ratio = x / (track.clientWidth - thumb.clientWidth);
        container.scrollLeft =
            ratio * (container.scrollWidth - container.clientWidth);
    };

    const onMouseUp = () => setDragging(false);

    useEffect(() => {
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        return () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };
    }, [dragging]);

    return (
        <div style={{ width, position: "relative", ...style }}>
            <div
                ref={containerRef}
                style={{
                    overflowX: "auto",
                    scrollbarWidth: "none", // Firefox
                    msOverflowStyle: "none", // IE/Edge
                }}
            >
                <div
                    className="flex"
                    style={{ display: "inline-block", minWidth: "100%" }}
                >
                    {children}
                </div>
            </div>

            <div
                ref={trackRef}
                style={{
                    width,
                    height: scrollbarHeight,
                    background: trackColor,
                    borderRadius,
                    position: "relative",
                    marginTop: 4,
                }}
                role="scrollbar"
                aria-orientation="horizontal"
                tabIndex={0}
            >
                <div
                    ref={thumbRef}
                    style={{
                        height: "100%",
                        background: thumbColor,
                        borderRadius,
                        position: "absolute",
                        left: 0,
                        cursor: "pointer",
                    }}
                    onMouseDown={() => setDragging(true)}
                />
            </div>
        </div>
    );
};

export default HorizontalScrollWrapper;
