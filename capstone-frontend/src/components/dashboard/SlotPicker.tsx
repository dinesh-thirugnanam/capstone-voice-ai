"use client";

import { useState } from "react";

const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
];

export default function SlotPicker({ onCreate }: any) {
    const [day, setDay] = useState("Monday");
    const [start, setStart] = useState("10:00");
    const [end, setEnd] = useState("11:00");

    function submit() {
        const today = new Date();

        const target = new Date(today);

        const dayIndex = days.indexOf(day);

        const diff = (dayIndex + 7 - today.getDay() + 1) % 7;

        target.setDate(today.getDate() + diff);

        const [sh, sm] = start.split(":");
        const [eh, em] = end.split(":");

        const startDate = new Date(target);
        startDate.setHours(+sh, +sm);

        const endDate = new Date(target);
        endDate.setHours(+eh, +em);

        onCreate(startDate.toISOString(), endDate.toISOString());
    }

    return (
        <div className="flex flex-wrap gap-3">
            <select
                className="border rounded-lg px-3 py-2"
                value={day}
                onChange={(e) => setDay(e.target.value)}
            >
                {days.map((d) => (
                    <option key={d}>{d}</option>
                ))}
            </select>

            <input
                type="time"
                className="border rounded-lg px-3 py-2"
                value={start}
                onChange={(e) => setStart(e.target.value)}
            />

            <input
                type="time"
                className="border rounded-lg px-3 py-2"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
            />

            <button
                onClick={submit}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
                Add Slot
            </button>
        </div>
    );
}
