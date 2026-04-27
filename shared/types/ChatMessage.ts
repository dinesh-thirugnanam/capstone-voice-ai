import AppointmentMessage from "./Appointmentessage.ts";
import TableMessage from "./TableMessage.ts";
import TextMessage from "./TextMessage.ts";
import QuestionMessage from "./QuestionMessage.ts";

type ChatMessage =
    | TextMessage
    | TableMessage
    | AppointmentMessage
    | QuestionMessage;

export default ChatMessage;
