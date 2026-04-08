"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API } from "@/lib/api";

export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function login() {
        const res = await fetch(`${API}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
            alert("Invalid login");
            return;
        }

        const user = await res.json();

        localStorage.setItem("user", JSON.stringify(user));

        if (user.role === "ADMIN") router.push("/admin");
        if (user.role === "COUNSELLOR") router.push("/counsellor");
        if (user.role === "PEER_SUPPORT") router.push("/peer");
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#DBE0DD] to-[#B3C1CE]">
            <div className="p-10 space-y-6 shadow-xl bg-white/70 backdrop-blur-xl rounded-xl w-80">
                <h1 className="text-xl font-semibold text-center">
                    College AI Login
                </h1>

                <input
                    placeholder="Email"
                    className="w-full px-3 py-2 border rounded-lg"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Password"
                    className="w-full px-3 py-2 border rounded-lg"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button
                    onClick={login}
                    className="w-full py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                    Login
                </button>
            </div>
        </div>
    );
}
