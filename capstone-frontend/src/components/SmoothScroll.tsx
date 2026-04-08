"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { Timestamp } from "next/dist/server/lib/cache-handlers/types";

export const lenisRef = { current: null as Lenis | null };
export default function SmoothScroll({
    containerRef,
}: {
    containerRef: React.RefObject<HTMLDivElement> | null;
}) {
    useEffect(() => {
        if (!containerRef!.current) return;

        const lenis = new Lenis({
            wrapper: containerRef!.current,
            content: containerRef!.current,
            smoothWheel: true,
            syncTouch: true,
            duration: 0.6,
        });

        lenisRef.current = lenis;

        function raf(time: Timestamp) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        return () => lenis.destroy();
    }, [containerRef]);

    return null;
}
