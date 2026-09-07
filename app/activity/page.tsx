"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
    IconLink,
    IconSun,
    IconMoonStars,
    IconArrowRight,
    IconHeartHandshake,
    IconCheck,
    IconFileText,
    IconExternalLink,
} from "@tabler/icons-react";

type ResourceItem = {
    url: string;
    name: string;
    kind: "file" | "link";
};

type Act = {
    id: string;
    giver_id: string;
    receiver_id: string;
    need_id: string;
    type: string;
    description: string;
    status: string;
    created_at: string;
    // Populated only for "Resources" acts (see ActClient's handleHelp insert)
    // — an array now, since a giver can attach multiple files and/or links.
    resources: ResourceItem[] | null;
};

export default function ActivityPage() {
    const router = useRouter();

    const [acts, setActs] = useState<Act[]>([]);
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [isDark, setIsDark] = useState(false);

    // Theme: same CSS-variable approach and storage key as the rest of the app.
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
        async function loadActs() {
            const userId = localStorage.getItem("kindchain_user_id");

            if (!userId) {
                router.push("/");
                return;
            }

            const { data, error } = await supabase
                .from("acts")
                .select("*")
                .eq("receiver_id", userId)
                .eq("status", "pending")
                .order("created_at", { ascending: false });

            if (error) {
                console.error(error);
                setError("Could not load your activity.");
                setLoading(false);
                return;
            }

            setActs(data ?? []);
            setLoading(false);
        }

        loadActs();
    }, [router]);

    async function confirmHelp(act: Act) {
        setConfirming(act.id);
        setError("");

        const { error: actError } = await supabase
            .from("acts")
            .update({
                status: "verified",
                verified_at: new Date().toISOString(),
            })
            .eq("id", act.id);

        if (actError) {
            console.error(actError);
            setError("Could not confirm the help.");
            setConfirming(null);
            return;
        }

        const { error: needError } = await supabase
            .from("needs")
            .update({ status: "fulfilled" })
            .eq("id", act.need_id);

        if (needError) {
            console.error(needError);
        }

        setActs((current) => current.filter((item) => item.id !== act.id));
        setConfirming(null);
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
                                KindChain
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.push("/community")}
                                className="flex items-center gap-1.5 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium transition hover:border-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text)]"
                            >
                                Community
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
                        </div>
                    </div>
                </header>

                <div className="mx-auto max-w-3xl px-6 py-12">
                    <h2
                        className="text-3xl leading-tight"
                        style={{ fontFamily: "Fraunces, serif" }}
                    >
                        Your activity
                    </h2>
                    <p className="mt-2 text-[var(--muted)]">
                        See how help is moving through the community.
                    </p>

                    {error && <p className="mt-6 text-sm text-[var(--text)]">{error}</p>}

                    {loading && (
                        <p className="mt-10 text-[var(--muted)]">Loading…</p>
                    )}

                    {!loading && acts.length === 0 && (
                        <div className="mt-10 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center">
                            <p className="font-medium">Nothing waiting for confirmation.</p>
                            <p className="mt-2 text-sm text-[var(--muted)]">
                                When someone helps you, it will appear here.
                            </p>
                        </div>
                    )}

                    <div className="mt-8 space-y-5">
                        {acts.map((act) => {
                            const items = act.resources ?? [];

                            return (
                                <article
                                    key={act.id}
                                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6"
                                >
                                    <div className="flex items-center gap-2 text-sm font-medium text-[var(--muted)]">
                                        <IconHeartHandshake size={16} stroke={1.75} />
                                        Someone helped you
                                    </div>

                                    <h3
                                        className="mt-3 text-xl"
                                        style={{ fontFamily: "Fraunces, serif" }}
                                    >
                                        {act.type}
                                    </h3>

                                    {act.description && (
                                        <p className="mt-3 leading-relaxed text-[var(--muted)]">
                                            {act.description}
                                        </p>
                                    )}

                                    {/*
                                      Resources acts: show every file/link so the receiver can
                                      open each one before confirming. Knowledge/Time acts never
                                      have resources to begin with (the help happened over the
                                      Meet call), so this block simply doesn't render for them.
                                    */}
                                    {act.type === "Resources" && items.length > 0 && (
                                        <ul className="mt-4 space-y-2">
                                            {items.map((item, index) => (
                                                <li key={`${item.url}-${index}`}>
                                                    <a
                                                        href={item.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm font-medium transition hover:border-[var(--text)]"
                                                    >
                                                        {item.kind === "link" ? (
                                                            <IconLink
                                                                size={16}
                                                                stroke={1.75}
                                                                className="shrink-0"
                                                            />
                                                        ) : (
                                                            <IconFileText
                                                                size={16}
                                                                stroke={1.75}
                                                                className="shrink-0"
                                                            />
                                                        )}
                                                        <span className="truncate">
                                                            {item.name ?? "Open"}
                                                        </span>
                                                        <IconExternalLink
                                                            size={14}
                                                            stroke={2}
                                                            className="ml-auto shrink-0 text-[var(--muted)]"
                                                        />
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    {act.type === "Resources" && items.length === 0 && (
                                        <p className="mt-4 text-sm text-[var(--muted)]">
                                            No files or links were attached to this act.
                                        </p>
                                    )}

                                    {act.type === "Resources" && items.length > 1 && (
                                        <p className="mt-3 text-xs font-medium text-[var(--muted)]">
                                            {items.length} items attached
                                        </p>
                                    )}

                                    <button
                                        onClick={() => confirmHelp(act)}
                                        disabled={confirming === act.id}
                                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--invert-bg)] px-5 py-3 font-medium text-[var(--invert-text)] transition hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text)] focus-visible:ring-offset-2 disabled:opacity-50"
                                    >
                                        {confirming === act.id ? (
                                            "Confirming…"
                                        ) : (
                                            <>
                                                Yes, I received the help
                                                <IconCheck size={17} stroke={2} />
                                            </>
                                        )}
                                    </button>
                                </article>
                            );
                        })}
                    </div>
                </div>
            </main>
        </>
    );
}