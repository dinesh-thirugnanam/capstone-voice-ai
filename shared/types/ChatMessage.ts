import AppointmentMessage from "./Appointmentessage.ts";
import TableMessage from "./TableMessage.ts";
import TextMessage from "./TextMessage.ts";

type ChatMessage = TextMessage | TableMessage | AppointmentMessage;

export default ChatMessage;
