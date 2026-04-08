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

export type RiskLevel =
  | "LOW"
  | "ELEVATED"
  | "HIGH"
  | "CRISIS";

export function transition(
  currentState: SessionState,
  event: string,
  currentRisk: RiskLevel
): { newState: SessionState; newRisk: RiskLevel } {

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

    case "READINESS_CHECK":
      if (event === "CONSENT_YES") {
        newState = "SCREENING";
      }
      if (event === "CONSENT_NO") {
        newState = "POST_SCREENING";
      }
      break;

    case "SCREENING":
      if (event === "HIGH_RISK") {
        newState = "ESCALATION_OFFERED";
        newRisk = "HIGH";
      }
      if (event === "SCREENING_COMPLETE") {
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
  }

  return { newState, newRisk };
}
