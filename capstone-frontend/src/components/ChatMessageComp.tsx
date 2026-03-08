import ChatMessage from "@/types/ChatMessage";
import TableMessageComp from "./TableMessageComp";
import TextMessageComp from "./TextMessageComp";
import AppointmentMessageComp from "./AppointmentMessageComp";

type Props = {
    message: ChatMessage;
};

export default function ChatMessageComp({ message }: Props) {
    const isUser = message.role === "user";

    let messageContent = null;

    switch (message.type) {
        case "table":
            messageContent = <TableMessageComp message={message} />;
            break;
        case "text":
            messageContent = <TextMessageComp message={message} />;
            break;
        case "appointments":
            messageContent = <AppointmentMessageComp message={message} />;
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
