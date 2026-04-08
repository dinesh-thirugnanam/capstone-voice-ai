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
import { getLLM } from "../llm/LLMFactory.ts";

import type { ChatResponse } from "./ChatTypes.ts";

export class ChatService {
    private llm = getLLM();

    async handleMessage(
        sessionId: string,
        message: string,
    ): Promise<ChatResponse> {
        const session = await this.getSession(sessionId);

        let state = session.current_state;
        let risk = session.risk_level;

        let screeningState = session.screening_state || createScreeningState();

        // Crisis quick gate
        if (isCrisisSignal(message)) {
            return {
                type: "crisis",
                content: "You're not alone. Let's connect you with support.",
            };
        }

        // Screening flow
        if (state === "SCREENING") {
            const parsed = parseScreeningResponse(message);

            if (parsed.value === null) {
                return {
                    type: "text",
                    content: CLARIFICATION_PROMPT,
                };
            }

            const value = parsed.value;
            const code = session.current_question_code;

            if (code.startsWith("PHQ2") || code.startsWith("GAD2")) {
                screeningState = applyMandatoryAnswer(
                    screeningState,
                    code,
                    value,
                );
            } else if (code === "SUICIDE_1") {
                screeningState = applySuicideAnswer(screeningState, value);
            } else {
                const symptom = this.getSymptom(code);
                screeningState = applyAdaptiveAnswer(
                    screeningState,
                    symptom,
                    value,
                );
            }

            const next = getNextQuestion(screeningState);

            if (!next) {
                const result = generateResult(screeningState);
                return { type: "result", data: result };
            }

            // Try to fetch question text from DB (DB-driven screening). Fallback to next.text
            const dbText = await this.getQuestionTextFromDB(next.code);
            const questionText = dbText || next.text;

            await this.updateSession(sessionId, {
                screening_state: screeningState,
                current_question_code: next.code,
            });

            return {
                type: "question",
                code: next.code,
                text: questionText,
            };
        }

        // Non-screening intents
        const intent = classifyIntent(message);

        if (intent === "MENTAL_HEALTH") {
            return {
                type: "text",
                content: "Would you like to go through a quick check-in?",
            };
        }

        // Default to streaming LLM reply
        return { type: "stream", prompt: message };
    }

    // Helpers
    private async getSession(id: string): Promise<any> {
        const { data } = await supabase
            .from("conversation_session")
            .select("*")
            .eq("id", id)
            .single();
        return data;
    }

    private async updateSession(id: string, updates: any) {
        await supabase
            .from("conversation_session")
            .update(updates)
            .eq("id", id);
    }

    private getSymptom(code: string) {
        const { SYMPTOM_POOL } = require("../core/ScreeningQuestions.ts");
        return SYMPTOM_POOL.find((s: any) => s.questionCode === code);
    }

    private async getQuestionTextFromDB(code: string): Promise<string | null> {
        try {
            const { data, error } = await supabase
                .from("screening_question")
                .select("text")
                .eq("code", code)
                .single();

            if (error || !data) return null;
            return (data as any).text || null;
        } catch (e) {
            return null;
        }
    }
}
