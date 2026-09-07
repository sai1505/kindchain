"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
    IconArrowLeft,
    IconSun,
    IconMoonStars,
    IconBulb,
    IconClock,
    IconGift,
    IconVideo,
    IconUpload,
    IconFileText,
    IconExternalLink,
} from "@tabler/icons-react";

type Category = "Knowledge" | "Time" | "Resources";

const categories: { name: Category; icon: typeof IconBulb; blurb: string }[] = [
    {
        name: "Knowledge",
        icon: IconBulb,
        blurb: "Someone explains or teaches something over a call.",
    },
    {
        name: "Time",
        icon: IconClock,
        blurb: "Someone just talks with you or hears you out, over a call.",
    },
    {
        name: "Resources",
        icon: IconGift,
        blurb: "A document, PDF, files or any resource links someone can send you.",
    },
];

export default function NeedPage() {
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState<Category>("Knowledge");
    const [meetLink, setMeetLink] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [resourceUrl, setResourceUrl] = useState("");
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isDark, setIsDark] = useState(false);

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

    function openMeetCreator() {
        window.open("https://meet.google.com/new", "_blank", "noopener,noreferrer");
    }

    async function handleSubmit() {
        if (!title.trim() || !description.trim()) {
            setError("Please tell us what you need.");
            return;
        }

        if ((type === "Knowledge" || type === "Time") && !meetLink.trim()) {
            setError("Add your Google Meet link so people know where to join.");
            return;
        }

        setLoading(true);
        setError("");

        const userId = localStorage.getItem("kindchain_user_id");

        if (!userId) {
            router.push("/");
            return;
        }

        const { error: needError } = await supabase.from("needs").insert({
            user_id: userId,
            title: title.trim(),
            description: description.trim(),
            type,
            status: "open",
            meet_link: type === "Knowledge" || type === "Time" ? meetLink.trim() : null,
        });

        if (needError) {
            console.error(needError);
            setError("Could not create your request.");
            setLoading(false);
            return;
        }

        router.push("/community");
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
          --placeholder: #b8b8b8;
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
          --placeholder: #5c5c5c;
          --invert-bg: #f5f5f5;
          --invert-text: #0a0a0a;
        }

        html,
        body {
          background: var(--bg);
        }
      `}</style>

            <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">
                <div className="mx-auto max-w-2xl px-6 py-10">
                    {/* Top row */}
                    <div className="mb-10 flex items-center justify-between">
                        <button
                            onClick={() => router.push("/community")}
                            className="flex items-center gap-1.5 text-sm font-medium text-[var(--muted)] transition hover:text-[var(--text)]"
                        >
                            <IconArrowLeft size={15} stroke={2} />
                            Back to community
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

                    {/* Heading */}
                    <div className="mb-10">
                        <h1
                            className="text-4xl leading-tight"
                            style={{ fontFamily: "Fraunces, serif" }}
                        >
                            What do you need?
                        </h1>
                        <p className="mt-3 text-lg text-[var(--muted)]">
                            Tell the community what you're looking for.
                        </p>
                    </div>

                    <div className="space-y-8">
                        {/* Title */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                What do you need?
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Someone to help me understand React hooks"
                                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none transition focus:border-[var(--text)] placeholder:text-[var(--placeholder)]"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Tell us more
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Explain what kind of help would be useful..."
                                rows={5}
                                className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none transition focus:border-[var(--text)] placeholder:text-[var(--placeholder)]"
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="mb-3 block text-sm font-medium">
                                Category
                            </label>

                            <div className="grid gap-3 sm:grid-cols-3">
                                {categories.map((category) => {
                                    const Icon = category.icon;
                                    const active = type === category.name;
                                    return (
                                        <button
                                            key={category.name}
                                            type="button"
                                            onClick={() => setType(category.name)}
                                            className={`rounded-xl border p-4 text-left transition ${active
                                                ? "border-[var(--text)] bg-[var(--invert-bg)] text-[var(--invert-text)]"
                                                : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--text)]"
                                                }`}
                                        >
                                            <Icon size={18} stroke={1.75} />
                                            <p className="mt-3 text-sm font-medium">
                                                {category.name}
                                            </p>
                                            <p
                                                className={`mt-1 text-xs leading-relaxed ${active ? "opacity-80" : "text-[var(--muted)]"
                                                    }`}
                                            >
                                                {category.blurb}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Conditional: Meet link for Knowledge / Time */}
                        {(type === "Knowledge" || type === "Time") && (
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <IconVideo size={16} stroke={1.75} />
                                    Meeting link
                                </div>
                                <p className="mt-1.5 text-sm text-[var(--muted)]">
                                    Start an instant Google Meet, then paste the link below so
                                    people know where to join you.
                                </p>

                                <button
                                    type="button"
                                    onClick={openMeetCreator}
                                    className="mt-4 flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3.5 py-2 text-sm font-medium transition hover:border-[var(--text)]"
                                >
                                    Create Google Meet
                                    <IconExternalLink size={14} stroke={2} />
                                </button>

                                <input
                                    type="url"
                                    value={meetLink}
                                    onChange={(e) => setMeetLink(e.target.value)}
                                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                                    className="mt-3 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--text)] placeholder:text-[var(--placeholder)]"
                                />
                            </div>
                        )}

                        {/* Error */}
                        {error && <p className="text-sm text-[var(--text)]">{error}</p>}

                        {/* Submit */}
                        <button
                            onClick={handleSubmit}
                            disabled={loading || uploading}
                            className="w-full rounded-xl bg-[var(--invert-bg)] px-5 py-3.5 font-medium text-[var(--invert-text)] transition hover:opacity-85 disabled:opacity-50"
                        >
                            {loading ? "Posting…" : "Post to KindChain"}
                        </button>
                    </div>
                </div>
            </main>
        </>
    );
}