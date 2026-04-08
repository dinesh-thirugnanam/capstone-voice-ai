import React, { useState } from "react";
import AppointmentMessage from "../../../shared/types/Appointmentessage";

type AppointmentMessageProps = {
    message: AppointmentMessage;
};

const bookSlot = async (slotId: string, name: string, email: string) => {
    try {
        const res = await fetch("http://localhost:4000/appointments/book", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                slot_id: slotId,
                student_name: name,
                student_email: email,
            }),
        });

        if (!res.ok) {
            throw new Error("Booking failed");
        }

        alert("Appointment booked!");
    } catch (err) {
        console.error(err);
    }
};

const AppointmentMessageComp = ({ message }: AppointmentMessageProps) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    const openModal = (slotId: string) => {
        setSelectedSlot(slotId);
        setModalOpen(true);
    };

    const handleConfirm = async () => {
        if (!selectedSlot) return;

        await bookSlot(selectedSlot, name, email);

        setModalOpen(false);
        setName("");
        setEmail("");
    };

    return (
        <>
            <div className="overflow-x-auto drop-shadow-sm">
                <table className="border-separate border-spacing-2 bg-[#B3C1CE]/30 rounded-xl">
                    <thead className="bg-gray-100/50">
                        <tr>
                            <th className="rounded-md px-2">Slot ID</th>
                            <th className="rounded-md px-2">Counsellor</th>
                            <th className="rounded-md px-2">Time</th>
                            <th className="rounded-md px-2">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {message.slots.map((slot, i) => (
                            <tr key={i}>
                                <td className="text-center">{i + 1}</td>
                                <td className="text-center">
                                    {slot.counsellor}
                                </td>
                                <td className="text-center">{slot.time}</td>
                                <td className="text-center">
                                    <button
                                        className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
                                        onClick={() => openModal(slot.id)}
                                    >
                                        Book
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {modalOpen && (
                <div className="fixed -translate-y-1/4 inset-0 flex items-center justify-center bg-white/20">
                    <div className="bg-[#B3C1CE] backdrop-blur-md rounded-xl p-6 w-[320px] drop-shadow-sm">
                        <h2 className="text-lg font-semibold mb-4">
                            Book Appointment
                        </h2>

                        <div className="flex flex-col gap-3">
                            <input
                                type="text"
                                placeholder="Your Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="p-2 rounded-md border border-gray-300"
                            />

                            <input
                                type="email"
                                placeholder="Your Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="p-2 rounded-md border border-gray-300"
                            />
                        </div>

                        <div className="flex justify-end gap-3 mt-5">
                            <button
                                className="px-3 py-2 rounded-md bg-gray-300 hover:bg-gray-400"
                                onClick={() => setModalOpen(false)}
                            >
                                Cancel
                            </button>

                            <button
                                className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
                                onClick={handleConfirm}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AppointmentMessageComp;
