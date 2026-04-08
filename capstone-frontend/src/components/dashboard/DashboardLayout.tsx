"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    const router = useRouter();
    return (
        <div className="flex min-h-screen animate-background ">
            {/* Sidebar */}

            <aside className="sticky top-0 left-0 flex flex-col w-64 h-screen border-r shadow-xl bg-white/40 backdrop-blur-xl border-white/40">
                <div className="p-6 text-2xl font-semibold tracking-wide">
                    College AI
                </div>

                <nav className="flex flex-col gap-2 px-4">
                    <Link
                        href="/admin"
                        className="px-4 py-2 transition rounded-lg hover:bg-white/60"
                    >
                        Admin
                    </Link>

                    <Link
                        href="/counsellor"
                        className="px-4 py-2 transition rounded-lg hover:bg-white/60"
                    >
                        Counsellor
                    </Link>

                    <Link
                        href="/peer"
                        className="px-4 py-2 transition rounded-lg hover:bg-white/60"
                    >
                        Peer Support
                    </Link>

                    <button
                        className="sticky bottom-0 px-4 py-2 transition rounded-lg hover:bg-white/60"
                        onClick={() => {
                            localStorage.removeItem("user");
                            router.push("/login");
                        }}
                    >
                        Log Out
                    </button>
                </nav>
            </aside>

            {/* Content */}

            <main className="flex-1 p-10 space-y-8">
                <h1 className="text-3xl font-semibold tracking-wide">
                    {title}
                </h1>

                {children}
            </main>
        </div>
    );
}
