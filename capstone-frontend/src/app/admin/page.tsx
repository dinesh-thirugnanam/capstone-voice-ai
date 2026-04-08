"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Card from "@/components/dashboard/Card";
import Table from "@/components/dashboard/Table";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function AdminPage() {
    const router = useRouter();
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user") || "null");

        if (!user || user.role !== "ADMIN") {
            router.push("/login");
        }
    }, []);
    const [users, setUsers] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("COUNSELLOR");

    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [location, setLocation] = useState("");
    const [organizer, setOrganizer] = useState("");

    useEffect(() => {
        load();
    }, []);

    async function load() {
        setUsers(await apiFetch("/users"));
        setEvents(await apiFetch("/events"));
    }

    async function createUser() {
        await apiFetch("/users", {
            method: "POST",
            body: JSON.stringify({ name, email, role }),
        });

        setName("");
        setEmail("");

        load();
    }

    async function deleteUser(id: string) {
        await apiFetch(`/users/${id}`, { method: "DELETE" });
        load();
    }

    async function createEvent() {
        await apiFetch("/events", {
            method: "POST",
            body: JSON.stringify({
                title,
                event_date: date,
                location,
                organizer,
            }),
        });

        setTitle("");
        setDate("");
        setLocation("");
        setOrganizer("");

        load();
    }

    async function deleteEvent(id: string) {
        await apiFetch(`/events/${id}`, { method: "DELETE" });
        load();
    }

    return (
        <DashboardLayout title="Admin Dashboard">
            {/* Users */}

            <Card title="Staff Management">
                <div className="flex gap-3">
                    <input
                        placeholder="Name"
                        className="px-3 py-2 border rounded-lg"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    <input
                        placeholder="Email"
                        className="px-3 py-2 border rounded-lg"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <select
                        className="px-3 py-2 border rounded-lg"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                    >
                        <option value="COUNSELLOR">Counsellor</option>
                        <option value="PEER_SUPPORT">Peer</option>
                    </select>

                    <button
                        onClick={createUser}
                        className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                        Create
                    </button>
                </div>

                <Table headers={["Name", "Email", "Role", ""]}>
                    {users.map((u) => (
                        <tr key={u.id} className="rounded shadow bg-white/80">
                            <td className="px-4 py-2">{u.name}</td>
                            <td className="px-4 py-2">{u.email}</td>
                            <td className="px-4 py-2">{u.role}</td>

                            <td className="px-4 py-2 text-right">
                                <button
                                    onClick={() => deleteUser(u.id)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </Table>
            </Card>

            {/* Events */}

            <Card title="College Events">
                <div className="flex flex-wrap gap-3">
                    <input
                        placeholder="Title"
                        className="px-3 py-2 border rounded-lg"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />

                    <input
                        type="datetime-local"
                        className="px-3 py-2 border rounded-lg"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />

                    <input
                        placeholder="Location"
                        className="px-3 py-2 border rounded-lg"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                    />

                    <input
                        placeholder="Organizer"
                        className="px-3 py-2 border rounded-lg"
                        value={organizer}
                        onChange={(e) => setOrganizer(e.target.value)}
                    />

                    <button
                        onClick={createEvent}
                        className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
                    >
                        Add Event
                    </button>
                </div>

                <Table headers={["Title", "Date", "Location", ""]}>
                    {events.map((e) => (
                        <tr key={e.id} className="shadow bg-white/80">
                            <td className="px-4 py-2">{e.title}</td>
                            <td className="px-4 py-2">
                                {new Date(e.event_date).toLocaleString()}
                            </td>
                            <td className="px-4 py-2">{e.location}</td>

                            <td className="px-4 py-2 text-right">
                                <button
                                    onClick={() => deleteEvent(e.id)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </Table>
            </Card>
        </DashboardLayout>
    );
}
