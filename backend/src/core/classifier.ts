export function classify(text: string): number | null {
    const t = text.toLowerCase();

    if (t.includes("not at all")) return 0;
    if (t.includes("several days")) return 1;
    if (t.includes("more than half")) return 2;
    if (t.includes("nearly every day")) return 3;

    if (t.includes("never")) return 0;
    if (t.includes("rarely")) return 1;
    if (t.includes("sometimes")) return 1;
    if (t.includes("often")) return 2;
    if (t.includes("almost always")) return 3;
    if (t.includes("every day")) return 3;

    return null;
}
