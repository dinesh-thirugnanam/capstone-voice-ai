"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Card from "@/components/dashboard/Card";
import { apiFetch } from "@/lib/api";
import SlotPicker from "@/components/dashboard/SlotPicker";
import { useRouter } from "next/navigation";

type Slot = {
    id: string;
    start_time: string;
    end_time: string;
};

type User = {
    id: string;
    name: string;
    email: string;
    role: string;
};

export default function CounsellorPage() {
    const router = useRouter();

    const [userId, setUserId] = useState<string | null>(null);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [appointments, setAppointments] = useState<any[]>([]);

    async function loadAppointments(userId: string) {
        const data = await apiFetch(`/appointments/user/${userId}`);

        setAppointments(data);
    }

    /* Load user from localStorage */

    useEffect(() => {
        const raw = localStorage.getItem("user");

        if (!raw) {
            router.push("/login");
            return;
        }

        const user: User = JSON.parse(raw);

        if (user.role !== "PEER_SUPPORT") {
            router.push("/login");
            return;
        }

        setUserId(user.id);
    }, [router]);

    /* Load slots */

    async function loadSlots(uid: string) {
        const data = await apiFetch(`/slots/user/${uid}`);
        setSlots(data);
    }

    useEffect(() => {
        if (userId) {
            loadSlots(userId);
            loadAppointments(userId);
        }
    }, [userId]);

    /* Create slot */

    async function createSlot(start: string, end: string) {
        if (!userId) return;

        await apiFetch("/slots", {
            method: "POST",
            body: JSON.stringify({
                counsellor_id: userId,
                start_time: start,
                end_time: end,
            }),
        });

        loadSlots(userId);
    }

    /* Delete slot */

    async function deleteSlot(id: string) {
        await apiFetch(`/slots/${id}`, {
            method: "DELETE",
        });

        if (userId) {
            loadSlots(userId);
        }
    }

    const slotsByDay = groupSlots(slots);

    return (
        <DashboardLayout title="Peer Support Dashboard">
            <Card title="Add Availability Slot">
                <SlotPicker
                    onCreate={async (start, end) => {
                        await createSlot(start, end);
                    }}
                />
            </Card>

            <Card title="Your Weekly Availability">
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {Object.entries(slotsByDay).map(([day, daySlots]) => (
                        <div
                            key={day}
                            className="p-4 space-y-3 rounded-lg shadow bg-white/70"
                        >
                            <h3 className="text-lg font-semibold">{day}</h3>

                            {daySlots.length === 0 && (
                                <p className="text-sm text-gray-400">
                                    No slots
                                </p>
                            )}

                            {daySlots.map((slot) => (
                                <div
                                    key={slot.id}
                                    className="flex items-center justify-between px-3 py-2 bg-white rounded shadow"
                                >
                                    <span className="text-sm">
                                        {formatTime(slot.start_time)} –{" "}
                                        {formatTime(slot.end_time)}
                                    </span>

                                    <button
                                        onClick={() => deleteSlot(slot.id)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </Card>
            <Card title="Booked Appointments">
                <table className="w-full border-separate border-spacing-y-2">
                    <thead>
                        <tr className="text-left">
                            <th>Student</th>
                            <th>Email</th>
                            <th>Start</th>
                            <th>End</th>
                        </tr>
                    </thead>

                    <tbody>
                        {appointments.map((a) => (
                            <tr
                                key={a.id}
                                className="rounded shadow bg-white/70"
                            >
                                <td className="px-3 py-2">{a.student_name}</td>

                                <td className="px-3 py-2">{a.student_email}</td>

                                <td className="px-3 py-2">
                                    {new Date(a.start_time).toLocaleString()}
                                </td>

                                <td className="px-3 py-2">
                                    {new Date(a.end_time).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </DashboardLayout>
    );
}

/* Helpers */

function groupSlots(slots: Slot[]) {
    const days: Record<string, Slot[]> = {
        Sunday: [],
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: [],
    };

    slots.forEach((slot) => {
        const d = new Date(slot.start_time);
        const day = d.toLocaleDateString("en-US", { weekday: "long" });

        days[day].push(slot);
    });

    return days;
}

function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
}
