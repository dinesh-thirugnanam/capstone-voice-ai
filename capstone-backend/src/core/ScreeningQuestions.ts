import type { Symptom } from "../types/types.ts";

// ─── Mandatory questions (PHQ-2 + GAD-2) ─────────────────────────────────────

export interface ScreeningQuestion {
    code: string;
    text: string;
    toolName: "PHQ2" | "GAD2" | "ADAPTIVE";
    orderIndex: number;
}

export const MANDATORY_QUESTIONS: ScreeningQuestion[] = [
    {
        code: "PHQ2_1",
        toolName: "PHQ2",
        orderIndex: 1,
        text: "Over the last two weeks, how often have you felt little interest or pleasure in doing things?",
    },
    {
        code: "PHQ2_2",
        toolName: "PHQ2",
        orderIndex: 2,
        text: "Over the last two weeks, how often have you been feeling down, depressed, or hopeless?",
    },
    {
        code: "GAD2_1",
        toolName: "GAD2",
        orderIndex: 3,
        text: "Over the last two weeks, how often have you been feeling nervous, anxious, or on edge?",
    },
    {
        code: "GAD2_2",
        toolName: "GAD2",
        orderIndex: 4,
        text: "Over the last two weeks, how often have you been unable to stop or control worrying?",
    },
];

// ─── Suicide ideation question ────────────────────────────────────────────────

export const SUICIDE_QUESTION: ScreeningQuestion = {
    code: "SUICIDE_1",
    toolName: "ADAPTIVE",
    orderIndex: 99,
    text: "Over the last two weeks, have you had any thoughts of hurting yourself or that you would be better off dead?",
};

// ─── Adaptive symptom pool ────────────────────────────────────────────────────
//
// base_weight reflects clinical significance in the PHQ-9 / GAD-7 framework.
// Higher weight = prioritised earlier in adaptive selection.

export const SYMPTOM_POOL: Symptom[] = [
    // Depression symptoms
    {
        key: "sleep",
        domain: "DEPRESSION",
        baseWeight: 1.5,
        questionCode: "ADAPT_SLEEP",
    },
    {
        key: "energy",
        domain: "DEPRESSION",
        baseWeight: 1.4,
        questionCode: "ADAPT_ENERGY",
    },
    {
        key: "appetite",
        domain: "DEPRESSION",
        baseWeight: 1.2,
        questionCode: "ADAPT_APPETITE",
    },
    {
        key: "self_worth",
        domain: "DEPRESSION",
        baseWeight: 1.6,
        questionCode: "ADAPT_SELFWORTH",
    },
    {
        key: "psychomotor",
        domain: "DEPRESSION",
        baseWeight: 1.1,
        questionCode: "ADAPT_PSYCHOMOTOR",
    },

    // Anxiety symptoms
    {
        key: "worry",
        domain: "ANXIETY",
        baseWeight: 1.5,
        questionCode: "ADAPT_WORRY",
    },
    {
        key: "control",
        domain: "ANXIETY",
        baseWeight: 1.3,
        questionCode: "ADAPT_CONTROL",
    },
    {
        key: "restlessness",
        domain: "ANXIETY",
        baseWeight: 1.2,
        questionCode: "ADAPT_RESTLESS",
    },
    {
        key: "irritability",
        domain: "ANXIETY",
        baseWeight: 1.1,
        questionCode: "ADAPT_IRRITABLE",
    },
    {
        key: "fear",
        domain: "ANXIETY",
        baseWeight: 1.0,
        questionCode: "ADAPT_FEAR",
    },

    // Shared symptoms (split between domains in scoring)
    {
        key: "concentration",
        domain: "SHARED",
        baseWeight: 1.4,
        questionCode: "ADAPT_CONCENTRATION",
    },
];

// ─── Adaptive question text map ───────────────────────────────────────────────

export const ADAPTIVE_QUESTION_TEXT: Record<string, string> = {
    ADAPT_SLEEP:
        "Over the last two weeks, how often have you had trouble falling or staying asleep, or sleeping too much?",
    ADAPT_ENERGY:
        "How often have you been feeling tired or having little energy?",
    ADAPT_APPETITE:
        "How often have you had a poor appetite or been overeating?",
    ADAPT_SELFWORTH:
        "How often have you been feeling bad about yourself — or that you are a failure or have let yourself or your family down?",
    ADAPT_PSYCHOMOTOR:
        "How often have you noticed moving or speaking so slowly that others could have noticed — or the opposite, being so fidgety or restless that you have been moving around a lot more than usual?",
    ADAPT_WORRY:
        "How often have you found it difficult to stop worrying about different things?",
    ADAPT_CONTROL:
        "How often have you felt that things are out of your control?",
    ADAPT_RESTLESS:
        "How often have you felt restless and found it hard to sit still?",
    ADAPT_IRRITABLE: "How often have you been easily annoyed or irritable?",
    ADAPT_FEAR:
        "How often have you felt afraid, as if something awful might happen?",
    ADAPT_CONCENTRATION:
        "How often have you had trouble concentrating on things — such as reading or watching TV?",
};

/**
 * Convenience: look up question text by code.
 * Works for both mandatory and adaptive codes.
 */
export function getQuestionText(code: string): string {
    if (code === "SUICIDE_1") return SUICIDE_QUESTION.text;

    const mandatory = MANDATORY_QUESTIONS.find((q) => q.code === code);
    if (mandatory) return mandatory.text;

    const adaptive = ADAPTIVE_QUESTION_TEXT[code];
    if (adaptive) return adaptive;

    throw new Error(`Unknown question code: ${code}`);
}
