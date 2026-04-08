import type {
    SessionState,
    SessionEvent,
    RiskLevel,
    TransitionResult,
} from "../types/types.ts";

/**
 * Pure state transition function.
 * Takes current state + event + risk, returns next state + risk.
 * No DB calls, no side effects — safe to call anywhere.
 */
export function transition(
    currentState: SessionState,
    event: SessionEvent,
    currentRisk: RiskLevel,
): TransitionResult {
    let newState: SessionState = currentState;
    let newRisk: RiskLevel = currentRisk;

    switch (currentState) {
        case "GENERAL_MODE":
            if (event === "REQUEST_SUPPORT") {
                newState = "CONSENT_REQUESTED";
            }
            break;

        case "CONSENT_REQUESTED":
            if (event === "CONSENT_YES") {
                newState = "MENTAL_WARMUP";
            }
            if (event === "CONSENT_NO") {
                newState = "GENERAL_MODE";
            }
            break;

        case "MENTAL_WARMUP":
            if (event === "RAPPORT_DONE") {
                newState = "EXPLORATORY";
            }
            break;

        case "EXPLORATORY":
            if (event === "ASK_READINESS") {
                newState = "READINESS_CHECK";
            }
            break;

        case "READINESS_CHECK":
            if (event === "READINESS_YES") {
                newState = "SCREENING";
            }
            if (event === "READINESS_NO") {
                newState = "POST_SCREENING";
            }
            break;

        case "SCREENING":
            if (event === "CRISIS") {
                newState = "ESCALATION_OFFERED";
                newRisk = "CRISIS";
            } else if (event === "HIGH_RISK") {
                newState = "ESCALATION_OFFERED";
                newRisk = "HIGH";
            } else if (event === "SCREENING_COMPLETE") {
                newState = "POST_SCREENING";
            }
            break;

        case "ESCALATION_OFFERED":
            if (event === "ACCEPT_ESCALATION") {
                newState = "BOOKING";
            }
            if (event === "DECLINE_ESCALATION") {
                newState = "POST_SCREENING";
            }
            break;

        case "POST_SCREENING":
            if (event === "BOOK_APPOINTMENT") {
                newState = "BOOKING";
            }
            if (event === "END_SESSION") {
                newState = "SESSION_CLOSED";
            }
            break;

        case "BOOKING":
            if (event === "END_SESSION") {
                newState = "SESSION_CLOSED";
            }
            break;

        case "SESSION_CLOSED":
            // terminal state — no transitions
            break;
    }

    return { newState, newRisk };
}

/**
 * Derive the risk level from a normalized screening score.
 * Separate from the state machine so it can be called independently.
 */
export function scoreToRisk(normalizedScore: number): RiskLevel {
    if (normalizedScore <= 4) return "LOW";
    if (normalizedScore <= 9) return "ELEVATED";
    if (normalizedScore <= 14) return "HIGH";
    return "CRISIS";
}
