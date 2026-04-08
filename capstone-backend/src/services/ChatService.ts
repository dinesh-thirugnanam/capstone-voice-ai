import { supabase } from "../lib/supabase.ts";

import { classifyIntent, isCrisisSignal } from "../core/IntentClassifier.ts";

import {
    parseScreeningResponse,
    CLARIFICATION_PROMPT,
} from "../core/ResponseParser.ts";

import { transition } from "../core/StateMachine.ts";

import {
    createScreeningState,
    getNextQuestion,
    applyMandatoryAnswer,
    applyAdaptiveAnswer,
    applySuicideAnswer,
    generateResult,
} from "../core/ScreeningAlgorithm.ts";

import type {
    ScreeningState,
    SessionState,
    RiskLevel,
} from "../types/types.ts";

export class ChatService {
    // ─────────────────────────────────────────────

    async handleMessage(sessionId: string, message: string) {
        // 1. LOAD SESSION
        const session = await this.getSession(sessionId);

        let screeningState: ScreeningState =
            session.screening_state || createScreeningState();

        let currentState: SessionState = session.current_state;
        let riskLevel: RiskLevel = session.risk_level;

        // ─────────────────────────────────────────────
        // 2. GLOBAL CRISIS CHECK
        // ─────────────────────────────────────────────

        if (isCrisisSignal(message)) {
            const { newState, newRisk } = transition(
                currentState,
                "CRISIS",
                riskLevel,
            );

            await this.updateSession(sessionId, {
                current_state: newState,
                risk_level: newRisk,
            });

            return this.crisisResponse();
        }

        // ─────────────────────────────────────────────
        // 3. INTENT CLASSIFICATION
        // ─────────────────────────────────────────────

        const intent = classifyIntent(message);

        // ─────────────────────────────────────────────
        // 4. HANDLE SCREENING FLOW
        // ─────────────────────────────────────────────

        if (currentState === "SCREENING") {
            // 4.1 Parse response
            const parsed = parseScreeningResponse(message);

            if (parsed.value === null) {
                return {
                    type: "text",
                    content: CLARIFICATION_PROMPT,
                };
            }

            const value = parsed.value;

            const currentQuestionCode = session.current_question_code;

            if (!currentQuestionCode) {
                throw new Error("Missing current_question_code");
            }

            // 4.2 Apply answer
            if (
                currentQuestionCode.startsWith("PHQ2") ||
                currentQuestionCode.startsWith("GAD2")
            ) {
                screeningState = applyMandatoryAnswer(
                    screeningState,
                    currentQuestionCode,
                    value,
                );
            } else if (currentQuestionCode === "SUICIDE_1") {
                screeningState = applySuicideAnswer(screeningState, value);

                if (screeningState.suicideFlag) {
                    const { newState, newRisk } = transition(
                        currentState,
                        "CRISIS",
                        riskLevel,
                    );

                    await this.updateSession(sessionId, {
                        current_state: newState,
                        risk_level: newRisk,
                    });

                    return this.crisisResponse();
                }
            } else {
                const symptom = this.getSymptomByCode(currentQuestionCode);

                screeningState = applyAdaptiveAnswer(
                    screeningState,
                    symptom,
                    value,
                );
            }

            // 4.3 Get next question
            const next = getNextQuestion(screeningState);

            // 4.4 If finished
            if (!next) {
                const result = generateResult(screeningState);

                const { newState, newRisk } = transition(
                    currentState,
                    "SCREENING_COMPLETE",
                    riskLevel,
                );

                await this.updateSession(sessionId, {
                    current_state: newState,
                    risk_level: newRisk,
                    screening_state: screeningState,
                    current_question_code: null,
                });

                return {
                    type: "result",
                    data: result,
                };
            }

            // 4.5 Save state
            await this.updateSession(sessionId, {
                screening_state: screeningState,
                current_question_code: next.code,
            });

            return {
                type: "question",
                code: next.code,
                text: next.text,
            };
        }

        // ─────────────────────────────────────────────
        // 5. NON-SCREENING FLOW (simplified for now)
        // ─────────────────────────────────────────────

        if (intent === "MENTAL_HEALTH") {
            const { newState } = transition(
                currentState,
                "REQUEST_SUPPORT",
                riskLevel,
            );

            await this.updateSession(sessionId, {
                current_state: newState,
            });

            return {
                type: "text",
                content:
                    "Would you like to go through a quick mental health check-in?",
            };
        }

        if (intent === "YES" && currentState === "READINESS_CHECK") {
            const { newState } = transition(
                currentState,
                "READINESS_YES",
                riskLevel,
            );

            const screeningState = createScreeningState();
            const firstQ = getNextQuestion(screeningState);

            await this.updateSession(sessionId, {
                current_state: newState,
                screening_state: screeningState,
                current_question_code: firstQ?.code,
            });

            return {
                type: "question",
                code: firstQ?.code,
                text: firstQ?.text,
            };
        }

        // fallback
        return {
            type: "text",
            content: "I'm here to help. Tell me what's on your mind.",
        };
    }

    // ─────────────────────────────────────────────

    private async getSession(sessionId: string) {
        const { data, error } = await supabase
            .from("conversation_session")
            .select("*")
            .eq("id", sessionId)
            .single();

        if (error) throw error;
        return data;
    }

    private async updateSession(sessionId: string, updates: any) {
        const { error } = await supabase
            .from("conversation_session")
            .update(updates)
            .eq("id", sessionId);

        if (error) throw error;
    }

    private getSymptomByCode(code: string) {
        const { SYMPTOM_POOL } = require("../core/ScreeningQuestions.ts");

        const found = SYMPTOM_POOL.find((s: any) => s.questionCode === code);

        if (!found) throw new Error("Invalid symptom code");

        return found;
    }

    private crisisResponse() {
        return {
            type: "crisis",
            content:
                "I'm really glad you shared that. You're not alone — support is available. Would you like to connect with someone right now?",
        };
    }
}
