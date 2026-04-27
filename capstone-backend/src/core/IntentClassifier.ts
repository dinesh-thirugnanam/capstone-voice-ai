import type { Intent } from "../types/types.ts";

// ─── Keyword banks ────────────────────────────────────────────────────────────

const MENTAL_HEALTH_KEYWORDS = [
    "anxious",
    "anxiety",
    "stress",
    "stressed",
    "depressed",
    "depression",
    "sad",
    "sadness",
    "hopeless",
    "worthless",
    "lonely",
    "overwhelmed",
    "panic",
    "scared",
    "fear",
    "nervous",
    "worried",
    "worry",
    "crying",
    "tired",
    "exhausted",
    "burnout",
    "sleep",
    "insomnia",
    "numb",
    "empty",
    "lost",
    "stuck",
    "angry",
    "frustrated",
    "hurt",
    "pain",
    "struggling",
    "struggle",
    "not okay",
    "not fine",
    "not good",
    "bad day",
    "hard time",
    "difficult",
    "mental health",
    "feeling",
    "can't cope",
    "cant cope",
    "breaking down",
    "falling apart",
    "suicidal",
    "self harm",
    "self-harm",
    "hurt myself",
    "end it",
    "give up",
    "no point",
    "pointless",
];

const COLLEGE_KEYWORDS = [
    "event",
    "events",
    "workshop",
    "seminar",
    "lecture",
    "schedule",
    "timetable",
    "club",
    "clubs",
    "fest",
    "festival",
    "hackathon",
    "department",
    "faculty",
    "professor",
    "class",
    "college",
    "campus",
    "canteen",
    "library",
    "lab",
    "examination",
    "exam",
    "assignment",
    "deadline",
    "attendance",
    "hostel",
];

const BOOKING_KEYWORDS = [
    "book",
    "booking",
    "appointment",
    "counsellor",
    "counselor",
    "therapist",
    "meet",
    "schedule a session",
    "talk to someone",
    "see someone",
    "meet someone",
];

const YES_PATTERNS = [
    "\\b(yes|yeah|yea|yep|sure|okay|ok|alright|fine)\\b",
    "i will",
    "i'd like",
    "i would",
    "sounds good",
    "go ahead",
];

const NO_PATTERNS = [
    "\\bno\\b",
    "\\bnope\\b",
    "\\bnah\\b",
    "not now",
    "not really",
    "i don't",
    "i dont",
    "no thanks",
    "maybe later",
    "\\bskip\\b",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalise(text: string): string {
    return text.toLowerCase().trim();
}

function matchesAny(text: string, keywords: string[]): boolean {
    return keywords.some((kw) => text.includes(kw));
}

function matchesPattern(text: string, patterns: string[]): boolean {
    return patterns.some((p) => new RegExp(p).test(text));
}

// ─── Main classifier ──────────────────────────────────────────────────────────

/**
 * Classify user message intent without any LLM call.
 * Returns the most specific matching intent, with mental health
 * and yes/no taking priority over general categories.
 */
export function classifyIntent(message: string): Intent {
    const t = normalise(message);

    // Yes/No checked first — short messages often collide with other keywords
    if (matchesPattern(t, YES_PATTERNS)) return "YES";
    if (matchesPattern(t, NO_PATTERNS)) return "NO";

    // Mental health signals are highest priority over other intents
    if (matchesAny(t, MENTAL_HEALTH_KEYWORDS)) return "MENTAL_HEALTH";

    if (matchesAny(t, BOOKING_KEYWORDS)) return "BOOKING_INTENT";

    if (matchesAny(t, COLLEGE_KEYWORDS)) return "COLLEGE_QUERY";

    return "OTHER";
}

/**
 * Detect emotional depth of a message on a 0–3 scale.
 * Replaces the LLM-based depthClassifier from the old backend.
 *
 * 0 = casual / greeting
 * 1 = mild emotional content
 * 2 = clear distress or emotional sharing
 * 3 = strong distress / crisis signals
 */
export function detectEmotionalDepth(message: string): 0 | 1 | 2 | 3 {
    const t = normalise(message);

    const CRISIS_SIGNALS = [
        "suicidal",
        "kill myself",
        "end it",
        "self harm",
        "self-harm",
        "hurt myself",
        "no point",
        "give up",
        "don't want to be here",
        "dont want to be here",
    ];
    if (matchesAny(t, CRISIS_SIGNALS)) return 3;

    const HIGH_DISTRESS = [
        "hopeless",
        "worthless",
        "breaking down",
        "falling apart",
        "can't cope",
        "cant cope",
        "depressed",
        "panic attack",
        "crying",
        "overwhelmed",
        "exhausted",
        "numb",
        "empty",
    ];
    if (matchesAny(t, HIGH_DISTRESS)) return 2;

    const MILD_EMOTIONAL = [
        "anxious",
        "stressed",
        "sad",
        "lonely",
        "nervous",
        "worried",
        "frustrated",
        "tired",
        "struggling",
        "not great",
        "not okay",
        "feeling down",
        "hard time",
    ];
    if (matchesAny(t, MILD_EMOTIONAL)) return 1;

    return 0;
}

/**
 * Determine whether a message contains crisis/suicide signals.
 * Used as a fast gate before the screening loop.
 */
export function isCrisisSignal(message: string): boolean {
    const t = normalise(message);
    const CRISIS = [
        "suicidal",
        "kill myself",
        "end my life",
        "end it all",
        "self harm",
        "self-harm",
        "hurt myself",
        "don't want to live",
        "dont want to live",
        "no reason to live",
        "want to die",
    ];
    return matchesAny(t, CRISIS);
}
