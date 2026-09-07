"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
    IconLink,
    IconSun,
    IconMoonStars,
    IconBell,
    IconArrowRight,
    IconLifebuoy,
    IconBulb,
    IconTool,
    IconGift,
    IconSparkles,
    IconUserCircle,
    IconLogout,
} from "@tabler/icons-react";

type Need = {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    type: string;
    status: string;
};

type Profile = {
    name: string;
    email: string;
};

// Best-guess icon per need type, falling back to a generic one.
function iconForType(type: string) {
    const t = type?.toLowerCase() ?? "";
    if (t.includes("skill")) return IconTool;
    if (t.includes("resource") || t.includes("item") || t.includes("book")) return IconGift;
    if (t.includes("knowledge") || t.includes("advice") || t.includes("mentor")) return IconBulb;
    return IconSparkles;
}

export default function CommunityPage() {
    const router = useRouter();

    const [needs, setNeeds] = useState<Need[]>([]);
    const [loading, setLoading] = useState(true);
    const [notifCount, setNotifCount] = useState(0);
    const [isDark, setIsDark] = useState(false);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Theme: same CSS-variable approach and storage key as the landing page.
    useEffect(() => {
        const stored = localStorage.getItem("kindchain_theme");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const dark = stored ? stored === "dark" : prefersDark;
        setIsDark(dark);
        document.documentElement.classList.toggle("dark", dark);
    }, []);

    function toggleTheme() {
        const next = !isDark;
        setIsDark(next);
        document.documentElement.classList.toggle("dark", next);
        localStorage.setItem("kindchain_theme", next ? "dark" : "light");
    }

    useEffect(() => {
        setCurrentUserId(localStorage.getItem("kindchain_user_id"));
    }, []);

    useEffect(() => {
        async function loadNeeds() {
            const { data, error } = await supabase
                .from("needs")
                .select("*")
                .eq("status", "open")
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Supabase error:", error);
                setLoading(false);
                return;
            }

            setNeeds(data ?? []);
            setLoading(false);
        }

        loadNeeds();
    }, []);

    // Unread notification count for the Activity badge.
    // Assumes a `notifications` table with `user_id` and `read` columns —
    // adjust the query below if your schema differs. Fails silently if not.
    useEffect(() => {
        async function loadNotifications() {
            const userId = localStorage.getItem("kindchain_user_id");
            if (!userId) return;

            const { count, error } = await supabase
                .from("notifications")
                .select("*", { count: "exact", head: true })
                .eq("user_id", userId)
                .eq("read", false);

            if (!error && typeof count === "number") {
                setNotifCount(count);
            }
        }

        loadNotifications();
    }, []);

    // Who's currently signed in, for the profile hover card.
    useEffect(() => {
        async function loadProfile() {
            const userId = localStorage.getItem("kindchain_user_id");
            if (!userId) return;

            const { data, error } = await supabase
                .from("users")
                .select("name, email")
                .eq("id", userId)
                .maybeSingle();

            if (!error && data) {
                setProfile(data);
            }
        }

        loadProfile();
    }, []);

    function scrollToNeeds() {
        document.getElementById("needs")?.scrollIntoView({ behavior: "smooth" });
    }

    function handleLogout() {
        localStorage.removeItem("kindchain_user_id");
        router.push("/");
    }

    return (
        <>
            <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap");

        :root {
          --bg: #ffffff;
          --surface: #ffffff;
          --text: #0a0a0a;
          --muted: #6b6b6b;
          --border: #e4e4e4;
          --border-soft: #ececec;
          --invert-bg: #0a0a0a;
          --invert-text: #ffffff;
        }

        html.dark {
          --bg: #0a0a0a;
          --surface: #141414;
          --text: #f5f5f5;
          --muted: #a0a0a0;
          --border: #2a2a2a;
          --border-soft: #1f1f1f;
          --invert-bg: #f5f5f5;
          --invert-text: #0a0a0a;
        }

        html,
        body {
          background: var(--bg);
        }
      `}</style>

            <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">
                {/* Header */}
                <header className="border-b border-[var(--border)] bg-[var(--surface)]">
                    <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
                        <div className="flex items-center gap-2">
                            <IconLink size={19} stroke={1.75} />
                            <span
                                className="text-[17px] tracking-tight"
                                style={{ fontFamily: "Fraunces, serif" }}
                            >
                                Kind Chain
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Profile: hover (or focus) to see who's signed in */}
                            <div className="group relative">
                                <button
                                    aria-label="Your account"
                                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted)] transition hover:border-[var(--text)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text)]"
                                >
                                    <IconUserCircle size={19} stroke={1.75} />
                                </button>

                                <div className="pointer-events-none absolute right-0 top-full z-10 mt-2 w-56 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                                    <p className="truncate text-sm font-medium text-[var(--text)]">
                                        {profile?.name ?? "Not signed in"}
                                    </p>
                                    <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
                                        {profile?.email ?? ""}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => router.push("/activity")}
                                aria-label={
                                    notifCount > 0
                                        ? `Activity — ${notifCount} unread`
                                        : "Activity"
                                }
                                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted)] transition hover:border-[var(--text)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text)]"
                            >
                                <IconBell size={17} stroke={1.75} />
                                {notifCount > 0 && (
                                    <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--invert-bg)] px-1 text-[10px] font-medium leading-none text-[var(--invert-text)]">
                                        {notifCount > 9 ? "9+" : notifCount}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => router.push("/chain")}
                                className="flex items-center gap-1.5 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium transition hover:border-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text)]"
                            >
                                My Chain
                                <IconArrowRight size={15} stroke={2} />
                            </button>

                            <button
                                onClick={toggleTheme}
                                aria-label="Toggle dark mode"
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted)] transition hover:border-[var(--text)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text)]"
                            >
                                {isDark ? (
                                    <IconSun size={17} stroke={1.75} />
                                ) : (
                                    <IconMoonStars size={17} stroke={1.75} />
                                )}
                            </button>

                            <button
                                onClick={handleLogout}
                                aria-label="Log out"
                                title="Log out"
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted)] transition hover:border-[var(--text)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text)]"
                            >
                                <IconLogout size={17} stroke={1.75} />
                            </button>
                        </div>
                    </div>
                </header>

                <div className="mx-auto max-w-5xl px-6 py-12">
                    {/* Hero */}
                    <section className="mb-12">
                        <h2
                            className="text-4xl leading-tight"
                            style={{ fontFamily: "Fraunces, serif" }}
                        >
                            What can you do today?
                        </h2>
                        <p className="mt-3 text-lg text-[var(--muted)]">
                            Ask for something you need, or give something you can.
                        </p>
                    </section>

                    {/* Primary actions */}
                    <section className="mb-16 grid gap-5 sm:grid-cols-2">
                        <div
                            onClick={() => router.push("/need")}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") router.push("/need");
                            }}
                            className="group cursor-pointer rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 text-left transition hover:-translate-y-1 hover:border-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text)]"
                        >
                            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)]">
                                <IconLifebuoy size={20} stroke={1.75} />
                            </span>

                            <h3
                                className="mt-5 text-xl"
                                style={{ fontFamily: "Fraunces, serif" }}
                            >
                                I need something
                            </h3>

                            <p className="mt-2 text-[var(--muted)]">
                                Ask the community for help.
                            </p>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    router.push("/need");
                                }}
                                className="mt-6 flex items-center gap-1.5 rounded text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text)]"
                            >
                                Create a request
                                <IconArrowRight
                                    size={15}
                                    stroke={2}
                                    className="transition group-hover:translate-x-0.5"
                                />
                            </button>
                        </div>
                    </section>

                    {/* Community */}
                    <section id="needs">
                        <div className="mb-6">
                            <h2 className="text-2xl" style={{ fontFamily: "Fraunces, serif" }}>
                                People who need something
                            </h2>
                            <p className="mt-1 text-[var(--muted)]">
                                Maybe you can be the person who helps.
                            </p>
                        </div>

                        {loading && (
                            <p className="text-[var(--muted)]">Loading community…</p>
                        )}

                        {!loading && needs.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center">
                                <p className="font-medium">No open requests yet.</p>
                                <p className="mt-2 text-sm text-[var(--muted)]">
                                    Be the first person to ask the community for something.
                                </p>
                            </div>
                        )}

                        <div className="space-y-4">
                            {needs.map((need) => {
                                const Icon = iconForType(need.type);
                                const isOwn = currentUserId !== null && need.user_id === currentUserId;

                                return (
                                    <article
                                        key={need.id}
                                        className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition hover:border-[var(--text)]"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex gap-4">
                                                <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)]">
                                                    <Icon size={16} stroke={1.75} />
                                                </span>

                                                <div>
                                                    <h3 className="text-lg font-medium">{need.title}</h3>

                                                    <p className="mt-2 leading-relaxed text-[var(--muted)]">
                                                        {need.description}
                                                    </p>

                                                    <span className="mt-4 inline-block rounded-full border border-[var(--border)] px-3 py-1 text-xs font-medium text-[var(--muted)]">
                                                        {need.type}
                                                    </span>
                                                </div>
                                            </div>

                                            {isOwn ? (
                                                <span className="shrink-0 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--muted)]">
                                                    Your request
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => router.push(`/act/${need.id}`)}
                                                    className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[var(--invert-bg)] px-4 py-2.5 text-sm font-medium text-[var(--invert-text)] transition hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text)] focus-visible:ring-offset-2"
                                                >
                                                    I can help
                                                    <IconArrowRight size={15} stroke={2} />
                                                </button>
                                            )}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
}