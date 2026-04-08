export type SessionState =
    | "GENERAL_MODE"
    | "MENTAL_WARMUP"
    | "EXPLORATORY"
    | "READINESS_CHECK"
    | "SCREENING"
    | "POST_SCREENING"
    | "ESCALATION_OFFERED"
    | "BOOKING"
    | "SESSION_CLOSED";

export type RiskLevel = "LOW" | "ELEVATED" | "HIGH" | "CRISIS";

export function transition(
    currentState: SessionState,
    event: string,
    currentRisk: RiskLevel,
) {
    let newState = currentState;
    let newRisk = currentRisk;

    switch (currentState) {
        case "GENERAL_MODE":
            if (event === "REQUEST_SUPPORT") {
                newState = "MENTAL_WARMUP";
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
    }

    return { newState, newRisk };
}
