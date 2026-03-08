import AppointmentMessage from "./Appointmentessage";
import TableMessage from "./TableMessage";
import TextMessage from "./TextMessage";

type ChatMessage =
    | TextMessage
    | TableMessage
    | AppointmentMessage;

export default ChatMessage;