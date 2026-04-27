/**
 * ScreeningAlgorithm.ts
 *
 * Pure implementation of the Integrated Adaptive Mental Health Screening
 * Algorithm (PHQ-2 + GAD-2 hybrid with adaptive expansion).
 *
 * All functions are pure — no DB calls, no side effects.
 * The ChatService owns the ScreeningState and calls these functions
 * to drive the conversation forward.
 */

import type {
    ScreeningState,
    ScreeningResult,
    PrimaryDomain,
    IndicationLevel,
    Symptom,
} from "../types/types.ts";

import {
    SYMPTOM_POOL,
    MANDATORY_QUESTIONS,
    SUICIDE_QUESTION,
    getQuestionText,
} from "./ScreeningQuestions.ts";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_ADAPTIVE_QUESTIONS = 6;
const ADAPTIVE_SCORE_CEILING = 15;
const EXPANSION_THRESHOLD = 3; // PHQ-2 or GAD-2 score that triggers full loop
const SUICIDE_TRIGGER_DEPRESSION = 3; // depression_score that triggers suicide q
const SUICIDE_TRIGGER_ADAPTIVE = 8; // adaptive_score that triggers suicide q
const CONSECUTIVE_SKIPS_TO_DISENGAGE = 2;

// ─── Initialisation ───────────────────────────────────────────────────────────

/**
 * Create a fresh ScreeningState for a new screening session.
 */
export function createScreeningState(): ScreeningState {
    return {
        anxietyScore: 0,
        depressionScore: 0,
        adaptiveScore: 0,
        questionsAsked: 0,
        askedSymptoms: new Set(),
        primaryDomain: null,
        suicideAsked: false,
        suicideFlag: false,
        disengaged: false,
        skipCount: 0,
    };
}

// ─── Step 3: Expansion decision ───────────────────────────────────────────────

/**
 * After the mandatory PHQ-2 + GAD-2 questions, decide whether to expand.
 * Returns true if the adaptive loop should start, false for a Minimal result.
 */
export function shouldExpand(state: ScreeningState): boolean {
    return (
        state.depressionScore >= EXPANSION_THRESHOLD ||
        state.anxietyScore >= EXPANSION_THRESHOLD
    );
}

// ─── Step 4: Primary domain determination ────────────────────────────────────

/**
 * Determine whether the primary area of concern is depression, anxiety, or mixed.
 * Called once after the mandatory phase, before the adaptive loop.
 */
export function determinePrimaryDomain(state: ScreeningState): PrimaryDomain {
    const diff = Math.abs(state.depressionScore - state.anxietyScore);
    if (diff >= 2) {
        return state.depressionScore > state.anxietyScore
            ? "DEPRESSION"
            : "ANXIETY";
    }
    return "MIXED";
}

// ─── Step 6: Adaptive question selection ─────────────────────────────────────

/**
 * Check all loop stop conditions.
 * Returns true if the adaptive loop should stop.
 */
export function shouldStopLoop(state: ScreeningState): boolean {
    if (state.disengaged) return true;
    if (state.questionsAsked >= MAX_ADAPTIVE_QUESTIONS) return true;
    if (state.adaptiveScore >= ADAPTIVE_SCORE_CEILING) return true;
    return false;
}

/**
 * Decide whether the suicide ideation question should be asked next.
 * Priority override — interrupts normal symptom selection.
 */
export function shouldAskSuicide(state: ScreeningState): boolean {
    if (state.suicideAsked) return false;
    return (
        state.depressionScore >= SUICIDE_TRIGGER_DEPRESSION ||
        state.adaptiveScore >= SUICIDE_TRIGGER_ADAPTIVE
    );
}

/**
 * Score each candidate symptom using the algorithm's weighting formula:
 *   - domain priority  (+2 primary, +1 mixed, +0.5 secondary)
 *   - coverage balance (+1.5 if domain is under-covered)
 *   - severity bias    (max_score × 0.2)
 *   - base weight      (from symptom definition)
 */
function scoreSymptom(symptom: Symptom, state: ScreeningState): number {
    const { primaryDomain, depressionScore, anxietyScore } = state;
    let score = 0;

    // Domain priority
    if (primaryDomain === "MIXED") {
        score += 1;
    } else if (
        symptom.domain === primaryDomain ||
        symptom.domain === "SHARED"
    ) {
        score += 2;
    } else {
        score += 0.5;
    }

    // Coverage balance — check if domain needs more coverage
    const depSymptomsCovered = [...state.askedSymptoms].filter((key) => {
        const s = SYMPTOM_POOL.find((s) => s.key === key);
        return s && (s.domain === "DEPRESSION" || s.domain === "SHARED");
    }).length;

    const anxSymptomsCovered = [...state.askedSymptoms].filter((key) => {
        const s = SYMPTOM_POOL.find((s) => s.key === key);
        return s && (s.domain === "ANXIETY" || s.domain === "SHARED");
    }).length;

    const COVERAGE_THRESHOLD = 2;
    if (
        symptom.domain === "DEPRESSION" &&
        depSymptomsCovered < COVERAGE_THRESHOLD
    ) {
        score += 1.5;
    } else if (
        symptom.domain === "ANXIETY" &&
        anxSymptomsCovered < COVERAGE_THRESHOLD
    ) {
        score += 1.5;
    } else if (symptom.domain === "SHARED") {
        // shared symptom helps both domains — give partial coverage bonus
        const bothUnder =
            depSymptomsCovered < COVERAGE_THRESHOLD &&
            anxSymptomsCovered < COVERAGE_THRESHOLD;
        if (bothUnder) score += 1.5;
    }

    // Severity bias
    const severity = Math.max(depressionScore, anxietyScore);
    score += severity * 0.2;

    // Base importance
    score += symptom.baseWeight;

    return score;
}

/**
 * Select the next best symptom to ask about.
 * Returns null if all candidates are exhausted.
 */
export function selectNextSymptom(state: ScreeningState): Symptom | null {
    const candidates = SYMPTOM_POOL.filter(
        (s) => !state.askedSymptoms.has(s.key),
    );

    if (candidates.length === 0) return null;

    let best = candidates[0];
    let bestScore = scoreSymptom(candidates[0], state);

    for (let i = 1; i < candidates.length; i++) {
        const s = scoreSymptom(candidates[i], state);
        if (s > bestScore) {
            bestScore = s;
            best = candidates[i];
        }
    }

    return best;
}

// ─── State update after an answer ────────────────────────────────────────────

/**
 * Apply a mandatory question answer (PHQ-2 or GAD-2) to the state.
 * Returns a new state object (immutable update).
 */
export function applyMandatoryAnswer(
    state: ScreeningState,
    questionCode: string,
    value: number,
): ScreeningState {
    const next = cloneState(state);

    if (questionCode.startsWith("PHQ2")) {
        next.depressionScore += value;
    } else if (questionCode.startsWith("GAD2")) {
        next.anxietyScore += value;
    }

    next.questionsAsked += 1;
    return next;
}

/**
 * Apply a suicide question answer to the state.
 * Returns a new state with suicideAsked = true and suicideFlag if triggered.
 */
export function applySuicideAnswer(
    state: ScreeningState,
    value: number,
): ScreeningState {
    const next = cloneState(state);
    next.suicideAsked = true;
    next.suicideFlag = value >= 1;
    next.questionsAsked += 1;
    return next;
}

/**
 * Apply an adaptive symptom answer to the state.
 * Returns a new state with scores and symptom tracking updated.
 */
export function applyAdaptiveAnswer(
    state: ScreeningState,
    symptom: Symptom,
    value: number,
): ScreeningState {
    const next = cloneState(state);

    next.adaptiveScore += value;
    next.questionsAsked += 1;
    next.askedSymptoms = new Set([...state.askedSymptoms, symptom.key]);

    if (symptom.domain === "DEPRESSION") {
        next.depressionScore += value;
    } else if (symptom.domain === "ANXIETY") {
        next.anxietyScore += value;
    } else {
        // SHARED — split evenly
        next.depressionScore += value * 0.5;
        next.anxietyScore += value * 0.5;
    }

    return next;
}

/**
 * Record a skip. Two consecutive skips triggers disengagement.
 */
export function applySkip(state: ScreeningState): ScreeningState {
    const next = cloneState(state);
    next.skipCount += 1;
    if (next.skipCount >= CONSECUTIVE_SKIPS_TO_DISENGAGE) {
        next.disengaged = true;
    }
    return next;
}

// ─── Step 8–9: Scoring and classification ────────────────────────────────────

/**
 * Normalise the adaptive score to a 0–27 PHQ-9 equivalent scale.
 * Used after the adaptive loop ends.
 */
export function normaliseScore(state: ScreeningState): number {
    const maxPossible = state.questionsAsked * 3;
    if (maxPossible === 0) return 0;
    return (state.adaptiveScore / maxPossible) * 27;
}

/**
 * Classify the normalised score into an indication level.
 */
export function classifyScore(normalizedScore: number): IndicationLevel {
    if (normalizedScore <= 4) return "MINIMAL";
    if (normalizedScore <= 9) return "MILD";
    if (normalizedScore <= 14) return "MODERATE";
    return "SEVERE";
}

// ─── Step 10: Final result ────────────────────────────────────────────────────

const RECOMMENDATIONS: Record<IndicationLevel, string> = {
    MINIMAL:
        "Your responses suggest you're managing reasonably well. General wellbeing resources and self-care practices may be helpful.",
    MILD: "Your responses suggest some mild difficulties. Self-help resources and optional peer support could be beneficial.",
    MODERATE:
        "Your responses suggest moderate distress. Speaking with a counsellor or joining a peer support group is recommended.",
    SEVERE: "Your responses suggest significant distress. It's strongly recommended that you speak with a mental health professional as soon as possible.",
};

/**
 * Produce the final ScreeningResult from the completed state.
 * This is the output of the entire algorithm.
 */
export function generateResult(state: ScreeningState): ScreeningResult {
    // 🚨 CRITICAL OVERRIDE: If the suicide flag was tripped at any point,
    // immediately escalate to SEVERE regardless of math score
    if (state.suicideFlag) {
        const severeWarning =
            "Your responses suggest significant distress. It's strongly recommended that you speak with a mental health professional as soon as possible. If you are in crisis, please contact emergency services or a crisis hotline immediately.";

        return {
            indicationLevel: "SEVERE" as IndicationLevel,
            suicide_flag: true,
            suicideFlag: true,
            normalized_score: 27,
            normalizedScore: 27,
            recommendation: severeWarning,
            advice: severeWarning,
            text: severeWarning,
            message: severeWarning,
            primaryDomain: state.primaryDomain,
        };
    }

    const normalizedScore = normaliseScore(state);
    const indicationLevel = classifyScore(normalizedScore);

    return {
        indicationLevel,
        suicideFlag: state.suicideFlag,
        recommendation: RECOMMENDATIONS[indicationLevel],
        primaryDomain: state.primaryDomain,
        normalizedScore,
    };
}

// ─── High-level question resolver ────────────────────────────────────────────

/**
 * Given the current state, return the next question code and text to send.
 * Returns null when screening is complete.
 *
 * This is the main entry point the ChatService calls each turn.
 *
 * Phase order:
 *   1. Mandatory PHQ-2 / GAD-2 (4 questions)
 *   2. Expansion check → if Minimal, return null immediately
 *   3. Suicide check (priority override)
 *   4. Adaptive symptom loop
 *   5. null → screening complete
 */
export function getNextQuestion(
    state: ScreeningState,
): { code: string; text: string } | null {
    const totalMandatory = MANDATORY_QUESTIONS.length;

    // Phase 1 — Mandatory
    if (state.questionsAsked < totalMandatory) {
        const q = MANDATORY_QUESTIONS[state.questionsAsked];
        return { code: q.code, text: q.text };
    }

    // Phase 2 — Expansion check (right after mandatory phase completes)
    if (state.questionsAsked === totalMandatory && !shouldExpand(state)) {
        return null; // Minimal — no adaptive loop needed
    }

    // Phase 3 — Suicide priority override
    if (shouldAskSuicide(state)) {
        return { code: SUICIDE_QUESTION.code, text: SUICIDE_QUESTION.text };
    }

    // Phase 4 — Adaptive loop
    if (shouldStopLoop(state)) {
        return null; // Loop complete
    }

    const symptom = selectNextSymptom(state);
    if (!symptom) return null;

    return {
        code: symptom.questionCode,
        text: getQuestionText(symptom.questionCode),
    };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cloneState(state: ScreeningState): ScreeningState {
    return {
        ...state,
        askedSymptoms: new Set(state.askedSymptoms),
    };
}
