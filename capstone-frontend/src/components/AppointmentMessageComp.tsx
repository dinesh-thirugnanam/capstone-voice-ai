import React from "react";
import AppointmentMessage from "../../../shared/types/Appointmentessage";

type AppointmentMessageProps = {
    message: AppointmentMessage;
};

const AppointmentMessageComp = ({ message }: AppointmentMessageProps) => {
    return (
        <div className="overflow-x-auto drop-shadow-sm">
            <table className="border-separate border-spacing-2 bg-[#B3C1CE]/30 rounded-xl">
                <thead className="bg-gray-100/50">
                    <tr>
                        <th className="rounded-md">Slot ID</th>
                        <th className="rounded-md">Counsellor</th>
                        <th className="rounded-md">Time</th>
                        <th className="rounded-md">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {message.slots.map((slot, i) => (
                        <tr key={i}>
                            <td>{slot.id}</td>
                            <td>{slot.counsellor}</td>
                            <td>{slot.time}</td>
                            <td>
                                <button
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                    onClick={() => {
                                        // placeholder for booking action
                                    }}
                                >
                                    Book
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AppointmentMessageComp;
