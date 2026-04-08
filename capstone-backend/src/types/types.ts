// ─── Session State ────────────────────────────────────────────────────────────

export type SessionState =
    | "GENERAL_MODE"
    | "CONSENT_REQUESTED"
    | "MENTAL_WARMUP"
    | "EXPLORATORY"
    | "READINESS_CHECK"
    | "SCREENING"
    | "POST_SCREENING"
    | "ESCALATION_OFFERED"
    | "BOOKING"
    | "SESSION_CLOSED";

export type RiskLevel = "LOW" | "ELEVATED" | "HIGH" | "CRISIS";

export type ConversationMode = "GENERAL" | "MENTAL_HEALTH";

// ─── Intent ───────────────────────────────────────────────────────────────────

export type Intent =
    | "MENTAL_HEALTH"
    | "COLLEGE_QUERY"
    | "BOOKING_INTENT"
    | "YES"
    | "NO"
    | "OTHER";

// ─── Screening ────────────────────────────────────────────────────────────────

export type IndicationLevel = "MINIMAL" | "MILD" | "MODERATE" | "SEVERE";

export type PrimaryDomain = "DEPRESSION" | "ANXIETY" | "MIXED";

export type SymptomDomain = "DEPRESSION" | "ANXIETY" | "SHARED";

export interface Symptom {
    key: string;
    domain: SymptomDomain;
    baseWeight: number;
    questionCode: string; // maps to a question in the bank
}

export interface ScreeningState {
    anxietyScore: number;
    depressionScore: number;
    adaptiveScore: number;
    questionsAsked: number;
    askedSymptoms: Set<string>;
    primaryDomain: PrimaryDomain | null;
    suicideAsked: boolean;
    suicideFlag: boolean;
    disengaged: boolean;
    skipCount: number; // consecutive skips — triggers disengagement
}

export interface ScreeningResult {
    indicationLevel: IndicationLevel;
    suicideFlag: boolean;
    recommendation: string;
    primaryDomain: PrimaryDomain | null;
    normalizedScore: number;
}

// ─── State Machine ────────────────────────────────────────────────────────────

export type SessionEvent =
    | "REQUEST_SUPPORT"
    | "CONSENT_YES"
    | "CONSENT_NO"
    | "RAPPORT_DONE"
    | "ASK_READINESS"
    | "READINESS_YES"
    | "READINESS_NO"
    | "SCREENING_COMPLETE"
    | "HIGH_RISK"
    | "CRISIS"
    | "ACCEPT_ESCALATION"
    | "DECLINE_ESCALATION"
    | "BOOK_APPOINTMENT"
    | "END_SESSION"
    | "SKIP";

export interface TransitionResult {
    newState: SessionState;
    newRisk: RiskLevel;
}
