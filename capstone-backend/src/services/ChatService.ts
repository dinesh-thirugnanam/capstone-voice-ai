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
    async handleMessage(
        sessionId: string,
        message: string,
        history: any[] = [],
    ) {
        console.log(`\n[ChatService] ===== NEW MESSAGE =====`);
        console.log(`[ChatService] SessionID: ${sessionId}`);
        console.log(`[ChatService] User Message: "${message}"`);

        const session = await this.getSession(sessionId);
        let screeningState: ScreeningState =
            session.screening_state || createScreeningState();
        let currentState: SessionState = session.current_state;
        let riskLevel: RiskLevel = session.risk_level;
        let exploratoryTurns: number = session.exploratory_turns || 0;

        console.log(`[ChatService] Current State: ${currentState}`);
        console.log(`[ChatService] Risk Level: ${riskLevel}`);
        console.log(`[ChatService] Exploratory Turns: ${exploratoryTurns}`);

        // 1. GLOBAL CRISIS CHECK
        if (isCrisisSignal(message)) {
            console.log(`[ChatService] ⚠️  CRISIS SIGNAL DETECTED!`);
            const { newState, newRisk } = transition(
                currentState,
                "CRISIS",
                riskLevel,
            );
            console.log(
                `[ChatService] Transitioning: ${currentState} → ${newState}`,
            );
            await this.updateSession(sessionId, {
                current_state: newState,
                risk_level: newRisk,
            });
            return this.crisisResponse();
        }

        const intent = classifyIntent(message);
        console.log(`[ChatService] Classified Intent: ${intent}`);

        // 2. COLLEGE QUERIES (Intercept before LLM)
        if (intent === "COLLEGE_QUERY") {
            const { data: events } = await supabase
                .from("college_event")
                .select("*")
                .limit(5);
            if (events && events.length > 0) {
                return {
                    type: "table",
                    columns: ["Event", "Date", "Location", "Organizer"],
                    rows: events.map((e: any) => [
                        e.title,
                        new Date(e.event_date).toLocaleString(),
                        e.location || "-",
                        e.organizer || "-",
                    ]),
                };
            }
        }

        // 3. BOOKING INTENT (Fetch Counsellors/Peers)
        if (intent === "BOOKING_INTENT" || currentState === "POST_SCREENING") {
            const { data: slots } = await supabase
                .from("availability_slot")
                .select("*, users(name)")
                .is("is_booked", false)
                .limit(5);
            if (slots && slots.length > 0) {
                return {
                    type: "appointments",
                    slots: slots.map((s: any) => ({
                        id: s.id,
                        counsellor: s.users?.name || "Counsellor",
                        time: s.start_time,
                    })),
                };
            }
        }

        // 4. SCREENING ALGORITHM FLOW
        if (currentState === "SCREENING") {
            console.log(`[ChatService] In SCREENING state`);
            const parsed = parseScreeningResponse(message);
            if (parsed.value === null) {
                console.log(
                    `[ChatService] Could not parse answer, asking for clarification`,
                );
                return { type: "text", content: CLARIFICATION_PROMPT };
            }

            const value = parsed.value;
            const currentQuestionCode = session.current_question_code;
            console.log(
                `[ChatService] Parsed answer value: ${value} for question: ${currentQuestionCode}`,
            );

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

            const next = getNextQuestion(screeningState);

            // Screening Completed
            if (!next) {
                console.log(`[ChatService] ✅ SCREENING COMPLETE`);
                const result = generateResult(screeningState);
                const { newState, newRisk } = transition(
                    currentState,
                    "SCREENING_COMPLETE",
                    riskLevel,
                );
                console.log(
                    `[ChatService] Screening Result: ${result.indicationLevel}`,
                );
                console.log(
                    `[ChatService] Transitioning: ${currentState} → ${newState}`,
                );
                await this.updateSession(sessionId, {
                    current_state: newState,
                    risk_level: newRisk,
                    screening_state: screeningState,
                    current_question_code: null,
                });
                console.log(`[ChatService] ✅ Database updated`);
                return { type: "result", data: result };
            }

            // Next Question
            console.log(`[ChatService] Moving to next question: ${next.code}`);
            await this.updateSession(sessionId, {
                screening_state: screeningState,
                current_question_code: next.code,
            });
            return { type: "question", code: next.code, text: next.text };
        }

        // 5. EXPLORATORY STATE MACHINE

        // A. General Mode -> Mental Health Triggered
        if (intent === "MENTAL_HEALTH" && currentState === "GENERAL_MODE") {
            console.log(
                `[ChatService] 🔴 MENTAL_HEALTH intent detected in GENERAL_MODE`,
            );
            const { newState } = transition(
                currentState,
                "REQUEST_SUPPORT",
                riskLevel,
            );
            console.log(
                `[ChatService] Transitioning: ${currentState} → ${newState}`,
            );
            await this.updateSession(sessionId, { current_state: newState });
            console.log(
                `[ChatService] ✅ Database updated to state: ${newState}`,
            );
            return {
                type: "text",
                content:
                    "I'm sorry you're feeling this way. I'm here to listen. Are you comfortable talking about your mental well-being with me right now?",
            };
        }

        // B. Consent Requested
        if (currentState === "CONSENT_REQUESTED") {
            console.log(
                `[ChatService] In CONSENT_REQUESTED state, intent: ${intent}`,
            );
            if (intent === "YES") {
                console.log(`[ChatService] ✅ User said YES to consent`);
                const { newState } = transition(
                    currentState,
                    "CONSENT_YES",
                    riskLevel,
                );
                console.log(
                    `[ChatService] Transitioning: ${currentState} → ${newState}`,
                );
                await this.updateSession(sessionId, {
                    current_state: newState,
                    exploratory_turns: 0,
                });
                console.log(
                    `[ChatService] ✅ Database updated to state: ${newState}`,
                );
                return {
                    type: "stream",
                    prompt: this.buildLLMPrompt(newState, message, history, 0),
                };
            } else if (intent === "NO") {
                console.log(`[ChatService] ❌ User said NO to consent`);
                const { newState } = transition(
                    currentState,
                    "CONSENT_NO",
                    riskLevel,
                );
                console.log(
                    `[ChatService] Transitioning: ${currentState} → ${newState}`,
                );
                await this.updateSession(sessionId, {
                    current_state: newState,
                });
                console.log(
                    `[ChatService] ✅ Database updated to state: ${newState}`,
                );
                return {
                    type: "text",
                    content:
                        "That's completely okay. I'm here if you ever want to talk. What else is on your mind?",
                };
            } else {
                console.log(
                    `[ChatService] No clear YES/NO response in CONSENT_REQUESTED, passing to LLM`,
                );
            }
        }

        // C. Mental Warmup & Exploratory (Listen for 2+ turns)
        if (
            currentState === "MENTAL_WARMUP" ||
            currentState === "EXPLORATORY"
        ) {
            exploratoryTurns++;

            // Move from Warmup to Exploratory after 1 turn
            if (currentState === "MENTAL_WARMUP" && exploratoryTurns >= 1) {
                currentState = transition(
                    currentState,
                    "RAPPORT_DONE",
                    riskLevel,
                ).newState;
            }

            // Move to Readiness Check after 2+ turns in Exploratory
            if (currentState === "EXPLORATORY" && exploratoryTurns >= 3) {
                const { newState } = transition(
                    currentState,
                    "ASK_READINESS",
                    riskLevel,
                );
                await this.updateSession(sessionId, {
                    current_state: newState,
                });
                return {
                    type: "text",
                    content:
                        "Thank you for sharing that with me. To help me understand exactly what you're going through, would you be open to answering a few quick questions?",
                };
            }

            await this.updateSession(sessionId, {
                current_state: currentState,
                exploratory_turns: exploratoryTurns,
            });
            return {
                type: "stream",
                prompt: this.buildLLMPrompt(
                    currentState,
                    message,
                    history,
                    exploratoryTurns,
                ),
            };
        }

        // D. Readiness Check (Gatekeeper to Screening)
        if (currentState === "READINESS_CHECK") {
            console.log(
                `[ChatService] In READINESS_CHECK state, intent: ${intent}`,
            );
            if (intent === "YES") {
                console.log(`[ChatService] ✅ User said YES to screening`);
                const { newState } = transition(
                    currentState,
                    "READINESS_YES",
                    riskLevel,
                );
                const newScreeningState = createScreeningState();
                const firstQ = getNextQuestion(newScreeningState);

                console.log(
                    `[ChatService] Transitioning: ${currentState} → ${newState}`,
                );
                await this.updateSession(sessionId, {
                    current_state: newState,
                    screening_state: newScreeningState,
                    current_question_code: firstQ?.code,
                });
                console.log(
                    `[ChatService] ✅ Database updated to state: ${newState}`,
                );
                console.log(
                    `[ChatService] Starting screening with question: ${firstQ?.code}`,
                );

                return {
                    type: "question",
                    code: firstQ?.code,
                    text: firstQ?.text,
                };
            } else if (intent === "NO") {
                console.log(`[ChatService] ❌ User said NO to screening`);
                const { newState } = transition(
                    currentState,
                    "READINESS_NO",
                    riskLevel,
                );
                console.log(
                    `[ChatService] Transitioning: ${currentState} → ${newState}`,
                );
                await this.updateSession(sessionId, {
                    current_state: newState,
                });
                console.log(
                    `[ChatService] ✅ Database updated to state: ${newState}`,
                );
                return {
                    type: "text",
                    content:
                        "I completely understand. We don't have to do that. Is there anything else you'd like to chat about?",
                };
            } else {
                console.log(
                    `[ChatService] No clear YES/NO response in READINESS_CHECK, passing to LLM`,
                );
            }
        }

        // 6. DEFAULT LLM FALLBACK
        console.log(`[ChatService] No state machine match, using LLM fallback`);
        console.log(
            `[ChatService] Current state: ${currentState}, Intent: ${intent}`,
        );
        return {
            type: "stream",
            prompt: this.buildLLMPrompt(
                currentState,
                message,
                history,
                exploratoryTurns,
            ),
        };
    }

    // ─────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────

    private buildLLMPrompt(
        state: string,
        userMessage: string,
        history: any[] = [],
        exploratoryTurns: number = 0,
    ): string {
        let systemInstruction = `You are a compassionate, professional Digital Mental Health Assistant for college students. Keep responses brief, conversational, and empathetic. Do not use emojis. Current state: ${state}. `;

        if (state === "GENERAL_MODE") {
            systemInstruction += "Be helpful and conversational.";
        } else if (state === "MENTAL_WARMUP" || state === "EXPLORATORY") {
            // Turn-awareness logic: guide towards readiness check
            if (exploratoryTurns < 2) {
                systemInstruction +=
                    "Listen empathetically. Reflect on what they are saying and ask ONE gentle, open-ended question to explore their feelings without diagnosing.";
            } else {
                systemInstruction +=
                    "You have listened to the user enough. Validate their feelings one last time, and gently ask if they would be open to answering a few quick questions to help you understand their situation better. Guide them towards a readiness check.";
            }
        }

        // Combine System Prompt + History + Current User Message
        const payload = [
            { role: "system", content: systemInstruction },
            ...history,
            { role: "user", content: userMessage },
        ];

        return JSON.stringify(payload);
    }

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
        console.log(`[ChatService] 💾 Updating session with:`, updates);
        const { error } = await supabase
            .from("conversation_session")
            .update(updates)
            .eq("id", sessionId);
        if (error) {
            console.error(`[ChatService] ❌ Error updating session:`, error);
            throw error;
        }
        console.log(`[ChatService] ✅ Session updated successfully`);
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
                "I'm really glad you shared that. You're not alone — support is available. Let's connect you with someone who can help right now.",
        };
    }
}
