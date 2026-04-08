export interface ParsedResponse {
    value: number | null; // 0–3, null if unclear
    confident: boolean;
}

// ─── Score keyword banks ───────────────────────────────────────────────────────
//
// Ordered from most specific to least specific within each score.
// Checked in order 3 → 0 so high-severity terms win on overlap.

const SCORE_3 = [
    "nearly every day",
    "every day",
    "all the time",
    "constantly",
    "always",
    "almost always",
    "every single day",
    "non stop",
    "non-stop",
    "every night",
];

const SCORE_2 = [
    "more than half",
    "more than half the days",
    "most days",
    "most of the time",
    "usually",
    "frequently",
    "a lot",
    "quite often",
    "often",
    "regularly",
    "many days",
];

const SCORE_1 = [
    "several days",
    "sometimes",
    "occasionally",
    "a few days",
    "a few times",
    "some days",
    "rarely",
    "here and there",
    "now and then",
    "once in a while",
    "a little",
    "a bit",
    "slightly",
    "kind of",
    "sort of",
    "somewhat",
];

const SCORE_0 = [
    "not at all",
    "never",
    "not really",
    "no",
    "nope",
    "not much",
    "not a problem",
    "fine",
    "i'm fine",
    "im fine",
    "not an issue",
    "doesn't apply",
    "doesn't affect",
];

// ─── Numeric / shorthand patterns ────────────────────────────────────────────

// Accepts bare digits: "0", "1", "2", "3" or ordinal-style: "3 - nearly every day"
const DIGIT_PATTERN = /^\s*([0-3])\s*[-–—]?.*/;

// ─── Core parser ─────────────────────────────────────────────────────────────

function normalise(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[.,!?]+$/, "");
}

function matchesAny(text: string, keywords: string[]): boolean {
    return keywords.some((kw) => text.includes(kw));
}

/**
 * Parse a user's free-text response to a screening question.
 * Returns a score 0–3, or null if the response is unclear.
 *
 * Replaces the LLM-based extractOption() from the old backend.
 */
export function parseScreeningResponse(message: string): ParsedResponse {
    const t = normalise(message);

    // Bare digit match — user typed "2" or "3 - nearly every day"
    const digitMatch = t.match(DIGIT_PATTERN);
    if (digitMatch) {
        return { value: parseInt(digitMatch[1]), confident: true };
    }

    // Keyword match — highest score wins on ambiguous overlap
    if (matchesAny(t, SCORE_3)) return { value: 3, confident: true };
    if (matchesAny(t, SCORE_2)) return { value: 2, confident: true };
    if (matchesAny(t, SCORE_1)) return { value: 1, confident: true };
    if (matchesAny(t, SCORE_0)) return { value: 0, confident: true };

    // Single-word fallbacks — less confident but still usable
    if (t === "yes" || t === "yeah") return { value: 2, confident: false };
    if (t === "no" || t === "nope") return { value: 0, confident: false };

    // Nothing matched
    return { value: null, confident: false };
}

/**
 * Clarification prompt to send back when parseScreeningResponse returns null.
 * Shown to the user so they can pick one of the four standard options.
 */
export const CLARIFICATION_PROMPT =
    "I want to make sure I understand — which of these fits best?\n" +
    "0 — Not at all\n" +
    "1 — Several days\n" +
    "2 — More than half the days\n" +
    "3 — Nearly every day";
