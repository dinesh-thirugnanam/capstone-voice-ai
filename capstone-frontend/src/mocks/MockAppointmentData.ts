import AppointmentMessage from "../../../shared/types/Appointmentessage";

const mockAppointment: AppointmentMessage = {
    id: "appt_001",
    role: "assistant",
    type: "appointments",
    slots: [
        {
            id: "slot_001",
            counsellor: "Dr. Emily Carter",
            time: "2026-03-10T09:30:00Z",
        },
        {
            id: "slot_002",
            counsellor: "Dr. Michael Nguyen",
            time: "2026-03-10T11:00:00Z",
        },
        {
            id: "slot_003",
            counsellor: "Dr. Sophia Patel",
            time: "2026-03-10T14:00:00Z",
        },
    ],
};

export default mockAppointment;
