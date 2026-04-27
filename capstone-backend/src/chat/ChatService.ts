import { supabase } from "../lib/supabase.ts";
import { v4 as uuidv4 } from "uuid";

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
import { EventService } from "../services/EventService.ts";
import { SlotService } from "../services/SlotService.ts";

import type { ChatResponse } from "./ChatTypes.ts";
import { SYMPTOM_POOL } from "../core/ScreeningQuestions.ts";

export class ChatService {
    private llm = getLLM();
    private eventService = new EventService();
    private slotService = new SlotService();

    async handleMessage(
        sessionId: string,
        message: string,
        history: any[] = [],
    ): Promise<ChatResponse> {
        console.log(`\n[ChatService] ===== NEW MESSAGE =====`);
        console.log(`[ChatService] SessionID: ${sessionId}`);
        console.log(`[ChatService] User Message: "${message}"`);

        const session = await this.getSession(sessionId);

        let state = session.current_state;
        let risk = session.risk_level;
        let exploratoryTurns = session.exploratory_turns || 0;

        let screeningState = session.screening_state || createScreeningState();

        console.log(`[ChatService] Current State: ${state}`);
        console.log(`[ChatService] Risk Level: ${risk}`);
        console.log(`[ChatService] Exploratory Turns: ${exploratoryTurns}`);

        // Crisis quick gate
        if (isCrisisSignal(message)) {
            console.log(`[ChatService] ⚠️  CRISIS SIGNAL DETECTED!`);
            return {
                type: "crisis",
                content: "You're not alone. Let's connect you with support.",
            };
        }

        // Screening flow
        if (state === "SCREENING") {
            console.log(`[ChatService] In SCREENING state`);
            const parsed = parseScreeningResponse(message);

            if (parsed.value === null) {
                console.log(
                    `[ChatService] Could not parse answer, asking for clarification`,
                );
                return {
                    type: "text",
                    content: CLARIFICATION_PROMPT,
                };
            }

            const value = parsed.value;
            const code = session.current_question_code;
            console.log(
                `[ChatService] Parsed answer value: ${value} for question: ${code}`,
            );

            if (code.startsWith("PHQ2") || code.startsWith("GAD2") || !code) {
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
                console.log(`[ChatService] ✅ SCREENING COMPLETE`);
                const result = generateResult(screeningState);
                console.log(
                    `[ChatService] Screening Result: ${result.indicationLevel}`,
                );

                const { newState, newRisk } = transition(
                    state,
                    "SCREENING_COMPLETE",
                    risk,
                );
                await this.updateSession(sessionId, {
                    current_state: newState,
                    risk_level: newRisk,
                    screening_state: screeningState,
                    current_question_code: null,
                });
                return { type: "result", data: result };
            }

            // Try to fetch question text from DB (DB-driven screening). Fallback to next.text
            const dbText = await this.getQuestionTextFromDB(next.code);
            const questionText = dbText || next.text;

            console.log(`[ChatService] Moving to next question: ${next.code}`);
            await this.updateSession(sessionId, {
                screening_state: screeningState,
                current_question_code: next.code,
            });

            return {
                id: uuidv4(),
                role: "assistant",
                type: "question",
                status: "done",
                code: next.code,
                content: questionText,
            };
        }

        // Non-screening intents
        const intent = classifyIntent(message);
        // console.log(`[ChatService] Classified Intent: ${intent}`);

        // ===== STATE MACHINE: GENERAL_MODE =====
        if (state === "GENERAL_MODE" && intent === "MENTAL_HEALTH") {
            console.log(
                `[ChatService] 🔴 MENTAL_HEALTH intent in GENERAL_MODE`,
            );
            const { newState } = transition(state, "REQUEST_SUPPORT", risk);
            console.log(`[ChatService] Transitioning: ${state} → ${newState}`);
            await this.updateSession(sessionId, { current_state: newState });
            console.log(
                `[ChatService] ✅ Database updated to state: ${newState}`,
            );
            return {
                type: "text",
                content:
                    "I'm sorry you're feeling this way. Would you like to talk about what's bothering you?",
            };
        }

        // ===== STATE MACHINE: CONSENT_REQUESTED =====
        if (state === "CONSENT_REQUESTED") {
            console.log(
                `[ChatService] In CONSENT_REQUESTED state, intent: ${intent}`,
            );
            if (intent === "YES") {
                console.log(`[ChatService] ✅ User said YES to consent`);
                const { newState } = transition(state, "CONSENT_YES", risk);
                console.log(
                    `[ChatService] Transitioning: ${state} → ${newState}`,
                );
                await this.updateSession(sessionId, {
                    current_state: newState,
                    exploratory_turns: 0,
                });
                console.log(
                    `[ChatService] ✅ Database updated to state: ${newState}`,
                );

                // Now we're in READINESS_CHECK or similar, ask about screening
                // Check if newState is READINESS_CHECK or EXPLORATORY
                if (newState === "READINESS_CHECK") {
                    return {
                        type: "text",
                        content:
                            "Great! To help me understand what you're going through, would you be open to answering a few quick screening questions?",
                    };
                } else {
                    // If it's MENTAL_WARMUP or EXPLORATORY, give a warm hardcoded transition
                    // The user will provide substance next, then MENTAL_WARMUP/EXPLORATORY handler takes over
                    return {
                        type: "text",
                        content:
                            "Thank you for trusting me. I'm here to listen. Could you tell me a little more about what's been making you feel stressed lately?",
                    };
                }
            } else if (intent === "NO") {
                console.log(`[ChatService] ❌ User said NO to consent`);
                const { newState } = transition(state, "CONSENT_NO", risk);
                console.log(
                    `[ChatService] Transitioning: ${state} → ${newState}`,
                );
                await this.updateSession(sessionId, {
                    current_state: newState,
                });
                console.log(
                    `[ChatService] ✅ Database updated to state: ${newState}`,
                );
                return {
                    type: "text",
                    content: "No problem. I'm here if you change your mind.",
                };
            }
        }

        // ===== STATE MACHINE: READINESS_CHECK =====
        if (state === "READINESS_CHECK") {
            console.log(
                `[ChatService] In READINESS_CHECK state, intent: ${intent}`,
            );
            if (intent === "YES") {
                console.log(`[ChatService] ✅ User said YES to screening`);
                const { newState } = transition(state, "READINESS_YES", risk);
                const newScreeningState = createScreeningState();
                const firstQ = getNextQuestion(newScreeningState);

                console.log(
                    `[ChatService] Transitioning: ${state} → ${newState}`,
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
                    `[ChatService] 📝 CREATING QUESTION: code=${firstQ?.code}, text="${firstQ?.text}"`,
                );

                return {
                    id: uuidv4(),
                    role: "assistant",
                    type: "question",
                    status: "done",
                    code: firstQ?.code,
                    content: firstQ?.text,
                };
            } else if (intent === "NO") {
                console.log(`[ChatService] ❌ User said NO to screening`);
                const { newState } = transition(state, "READINESS_NO", risk);
                console.log(
                    `[ChatService] Transitioning: ${state} → ${newState}`,
                );
                await this.updateSession(sessionId, {
                    current_state: newState,
                });
                console.log(
                    `[ChatService] ✅ Database updated to state: ${newState}`,
                );
                return {
                    type: "text",
                    content: "That's okay. Let me know if you want to talk.",
                };
            }
        }

        // ===== STATE MACHINE: MENTAL_WARMUP & EXPLORATORY =====
        if (state === "MENTAL_WARMUP" || state === "EXPLORATORY") {
            console.log(
                `[ChatService] In ${state} state, Turn: ${exploratoryTurns}`,
            );
            exploratoryTurns++;

            // Move from Warmup to Exploratory after 1 turn
            if (state === "MENTAL_WARMUP" && exploratoryTurns >= 1) {
                const { newState } = transition(state, "RAPPORT_DONE", risk);
                state = newState;
                console.log(
                    `[ChatService] Transitioning: MENTAL_WARMUP → ${newState}`,
                );
            }

            // Move to Readiness Check after 3+ turns in Exploratory
            if (state === "EXPLORATORY" && exploratoryTurns >= 3) {
                console.log(`[ChatService] 3+ exploratory turns reached`);
                const { newState } = transition(state, "ASK_READINESS", risk);
                console.log(
                    `[ChatService] Transitioning: EXPLORATORY → ${newState}`,
                );
                await this.updateSession(sessionId, {
                    current_state: newState,
                    exploratory_turns: exploratoryTurns,
                });
                console.log(
                    `[ChatService] ✅ Database updated to state: ${newState}`,
                );
                return {
                    type: "text",
                    content:
                        "Thank you for sharing that with me. To help me understand exactly what you're going through, would you be open to answering a few quick questions?",
                };
            }

            // Save the incremented turns back to the DB
            console.log(
                `[ChatService] Incrementing exploratory turns to ${exploratoryTurns}`,
            );
            await this.updateSession(sessionId, {
                current_state: state,
                exploratory_turns: exploratoryTurns,
            });
            console.log(
                `[ChatService] ✅ Database updated with new turn count`,
            );

            // IMPORTANT: Return the LLM stream from inside this block!
            console.log(
                `[ChatService] Returning LLM stream for empathetic response`,
            );
            return {
                type: "stream",
                prompt: this.buildLLMPrompt(
                    state,
                    message,
                    history,
                    exploratoryTurns,
                ),
            };
        }

        // ===== INTENT ROUTING: Booking Intent or Post-Screening Auto-Trigger =====
        if (intent === "BOOKING_INTENT" || state === "POST_SCREENING") {
            console.log(
                `[ChatService] 📅 BOOKING_INTENT detected or POST_SCREENING state`,
            );
            const slots = await this.slotService.getAvailableSlots();

            // Important: Reset the state so we don't get stuck in a POST_SCREENING loop forever
            if (state === "POST_SCREENING") {
                console.log(
                    `[ChatService] Resetting POST_SCREENING state to GENERAL_MODE`,
                );
                await this.updateSession(sessionId, {
                    current_state: "GENERAL_MODE",
                });
            }

            if (slots && slots.length > 0) {
                console.log(
                    `[ChatService] Found ${slots.length} available slots`,
                );
                const appointmentResponse = {
                    id: uuidv4(),
                    role: "assistant",
                    type: "appointments",
                    slots: slots.map((s: any) => ({
                        id: s.id,
                        counsellor: s.users?.name || "Counsellor",
                        time: s.start_time,
                    })),
                };
                console.log(
                    `[ChatService] 🔴 RETURNING APPOINTMENTS:`,
                    JSON.stringify(appointmentResponse, null, 2),
                );
                return appointmentResponse;
            } else {
                console.log(
                    `[ChatService] No available slots, returning message`,
                );
                return {
                    id: uuidv4(),
                    role: "assistant",
                    type: "text",
                    status: "done",
                    content:
                        "I wanted to show you some available appointment slots, but there are none currently open in the database right now. Please reach out to the campus health center directly.",
                };
            }
        }

        // ===== INTENT ROUTING: College Queries =====
        if (intent === "COLLEGE_QUERY") {
            console.log(`[ChatService] 📚 COLLEGE_QUERY intent detected`);
            const events = await this.eventService.getAllEvents();

            if (events && events.length > 0) {
                console.log(
                    `[ChatService] Found ${events.length} college events`,
                );
                const tableResponse = {
                    id: uuidv4(),
                    role: "assistant",
                    type: "table",
                    columns: ["Event", "Date", "Location", "Organizer"],
                    rows: events.map((e: any) => [
                        e.title,
                        new Date(e.event_date).toLocaleString(),
                        e.location ?? "-",
                        e.organizer ?? "-",
                    ]),
                };
                console.log(
                    `[ChatService] 🔴 RETURNING TABLE:`,
                    JSON.stringify(tableResponse, null, 2),
                );
                return tableResponse;
            } else {
                console.log(
                    `[ChatService] No college events in database, returning helpful message`,
                );
                return {
                    id: uuidv4(),
                    role: "assistant",
                    type: "text",
                    status: "done",
                    content:
                        "I checked the college database, but there are no upcoming events listed at the moment. Is there anything else I can help you with?",
                };
            }
        }

        // ===== DEFAULT: No state match, use LLM =====
        console.log(`[ChatService] No state machine match, using LLM fallback`);
        console.log(`[ChatService] Current state: ${state}, Intent: ${intent}`);
        return { type: "stream", prompt: message };
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
            systemInstruction +=
                "Be helpful and conversational. If the user mentions stress or mental health concerns, gently offer support.";
        } else if (state === "MENTAL_WARMUP" || state === "EXPLORATORY") {
            // Turn-awareness logic: guide towards readiness check
            if (exploratoryTurns < 2) {
                systemInstruction +=
                    "Listen empathetically. Reflect on what they are saying and ask ONE gentle, open-ended question to explore their feelings without diagnosing.";
            } else {
                systemInstruction +=
                    "You have listened to the user enough. Validate their feelings one last time, and gently ask if they would be open to answering a few quick questions to help you understand their situation better.";
            }
        } else if (state === "CONSENT_YES") {
            systemInstruction +=
                "The user has agreed to talk about mental health. Ask ONE gentle exploratory question to understand their situation.";
        } else if (state === "POST_SCREENING") {
            systemInstruction +=
                "The user has completed screening. Be highly supportive. If their risk is elevated, gently encourage them to book an appointment with a counsellor.";
        }

        // Combine System Prompt + History + Current User Message
        const payload = [
            { role: "system", content: systemInstruction },
            ...history,
            { role: "user", content: userMessage },
        ];

        return JSON.stringify(payload);
    }

    private async getSession(id: string): Promise<any> {
        console.log(`[ChatService] 📖 Fetching session from DB...`);
        const { data } = await supabase
            .from("conversation_session")
            .select("*")
            .eq("id", id)
            .single();
        if (data) {
            console.log(
                `[ChatService] ✅ Session loaded: state=${data.current_state}, risk=${data.risk_level}`,
            );
            // FIX: Rebuild the JavaScript Set from the database Array
            if (data.screening_state) {
                data.screening_state.askedSymptoms = new Set(
                    data.screening_state.askedSymptoms || [],
                );
            }
        }
        return data;
    }

    private async updateSession(id: string, updates: any) {
        console.log(`[ChatService] 💾 Updating session with:`, updates);
        // FIX: Convert the JavaScript Set to an Array before saving to the database
        if (
            updates.screening_state &&
            updates.screening_state.askedSymptoms instanceof Set
        ) {
            updates.screening_state = {
                ...updates.screening_state,
                askedSymptoms: Array.from(
                    updates.screening_state.askedSymptoms,
                ),
            };
        }
        const { error } = await supabase
            .from("conversation_session")
            .update(updates)
            .eq("id", id);
        if (error) {
            console.error(`[ChatService] ❌ Error updating session:`, error);
            throw error;
        }
        console.log(`[ChatService] ✅ Session updated successfully`);
    }

    private getSymptom(code: string) {
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
