import ChatMessage from "../../../shared/types/ChatMessage";
import TableMessageComp from "./TableMessageComp";
import TextMessageComp from "./TextMessageComp";
import AppointmentMessageComp from "./AppointmentMessageComp";
import { sendMessage } from "@/services/socket";

type Props = {
    message: ChatMessage;
};

export default function ChatMessageComp({ message }: Props) {
    console.log(`[ChatMessageComp] Rendering message:`, message);
    console.log(`[ChatMessageComp] Message type: ${message?.type}`);

    if (!message) return null;
    const isUser = message.role === "user";

    let messageContent = null;

    switch (message.type) {
        case "table":
            console.log(`[ChatMessageComp] Rendering TABLE`);
            messageContent = <TableMessageComp message={message} />;
            break;
        case "text":
            console.log(`[ChatMessageComp] Rendering TEXT`);
            messageContent = <TextMessageComp message={message} />;
            break;
        case "appointments":
            console.log(`[ChatMessageComp] Rendering APPOINTMENTS:`, message);
            messageContent = <AppointmentMessageComp message={message} />;
            break;
        case "question":
            console.log(
                `[ChatMessageComp-QUESTION] 📝 Rendering question with content="${message.content}"`,
            );
            messageContent = (
                <div className="flex flex-col gap-3">
                    <p className="font-semibold text-gray-900">
                        {message.content}
                    </p>
                    <div className="flex flex-col gap-2 mt-2">
                        <button
                            onClick={() => sendMessage("0 - Not at all")}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 px-3 rounded-lg text-left transition-colors text-xs font-normal"
                        >
                            0 - Not at all
                        </button>
                        <button
                            onClick={() => sendMessage("1 - Several days")}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 px-3 rounded-lg text-left transition-colors text-xs font-normal"
                        >
                            1 - Several days
                        </button>
                        <button
                            onClick={() =>
                                sendMessage("2 - More than half the days")
                            }
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 px-3 rounded-lg text-left transition-colors text-xs font-normal"
                        >
                            2 - More than half the days
                        </button>
                        <button
                            onClick={() => sendMessage("3 - Nearly every day")}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 px-3 rounded-lg text-left transition-colors text-xs font-normal"
                        >
                            3 - Nearly every day
                        </button>
                    </div>
                </div>
            );
            break;
    }

    return (
        <div
            className={`w-full px-8 flex ${
                isUser ? "justify-end" : "justify-start"
            }`}
        >
            <div
                className={`max-w-full px-4 py-3 rounded-t-2xl font-poiret font-bold text-sm outline outline-white/30 backdrop-blur-2xl ${
                    isUser
                        ? "bg-white/70 text-black rounded-bl-2xl"
                        : "bg-gray-200/50 text-black rounded-br-2xl"
                }`}
            >
                {messageContent}
            </div>
        </div>
    );
}
