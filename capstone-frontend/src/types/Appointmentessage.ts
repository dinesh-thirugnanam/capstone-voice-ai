type AppointmentMessage = {
    id: string;
    role: "assistant";
    type: "appointments";
    slots: {
        id: string;
        counsellor: string;
        time: string;
    }[];
};

export default AppointmentMessage;
