"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
    IconArrowLeft,
    IconSun,
    IconMoonStars,
    IconBulb,
    IconClock,
    IconGift,
    IconSparkles,
    IconVideo,
    IconExternalLink,
    IconUpload,
    IconFileText,
    IconInfoCircle,
    IconLink,
    IconX,
} from "@tabler/icons-react";

type Need = {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    type: string;
    status: string;
    meet_link: string | null;
    resource_url: string | null;
};

// One item the giver is handing over — either an uploaded file or a pasted
// link (Drive folder, YouTube/Loom recording, etc). Both render the same
// way in the list, so a Resources act can mix as many of each as needed.
type ResourceItem = {
    url: string;
    name: string;
    kind: "file" | "link";
};

function iconForType(type: string) {
    if (type === "Knowledge") return IconBulb;
    if (type === "Time") return IconClock;
    if (type === "Resources") return IconGift;
    return IconSparkles;
}

export default function ActClient({ needId }: { needId: string }) {
    const router = useRouter();

    const [need, setNeed] = useState<Need | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [description, setDescription] = useState("");
    const [resourceItems, setResourceItems] = useState<ResourceItem[]>([]);
    const [linkInput, setLinkInput] = useState("");
    const [uploading, setUploading] = useState(false);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
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

    useEffect(() => {
        async function loadNeed() {
            const userId = localStorage.getItem("kindchain_user_id");
            setCurrentUserId(userId);

            const { data, error } = await supabase
                .from("needs")
                .select("*")
                .eq("id", needId)
                .single();

            if (error) {
                console.error(error);
                setError("Could not find this request.");
                setLoading(false);
                return;
            }

            setNeed(data);
            setLoading(false);
        }

        loadNeed();
    }, [needId]);

    // Handles one or many files selected at once. Uploads them one by one
    // and appends each to the resource list as it finishes, rather than
    // replacing whatever was already added.
    async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
        const selected = Array.from(e.target.files ?? []);
        if (selected.length === 0) return;

        setUploading(true);
        setError("");

        const uploaded: ResourceItem[] = [];

        for (const file of selected) {
            const path = `${Date.now()}-${file.name}`;

            const { error: uploadError } = await supabase.storage
                .from("resources")
                .upload(path, file);

            if (uploadError) {
                console.error(uploadError);
                setError(`Could not upload "${file.name}". The others were still added.`);
                continue;
            }

            const { data } = supabase.storage.from("resources").getPublicUrl(path);
            uploaded.push({ url: data.publicUrl, name: file.name, kind: "file" });
        }

        setResourceItems((current) => [...current, ...uploaded]);
        setUploading(false);
        // Let the same file(s) be re-selected later if needed.
        e.target.value = "";
    }

    function addLink() {
        const url = linkInput.trim();
        if (!url) return;

        try {
            // Throws if it isn't a valid absolute URL.
            new URL(url);
        } catch {
            setError("That doesn't look like a valid link (include https://).");
            return;
        }

        setResourceItems((current) => [...current, { url, name: url, kind: "link" }]);
        setLinkInput("");
        setError("");
    }

    function removeResource(index: number) {
        setResourceItems((current) => current.filter((_, i) => i !== index));
    }

    async function handleHelp() {
        const userId = localStorage.getItem("kindchain_user_id");

        if (!userId) {
            router.push("/");
            return;
        }

        if (!need) return;

        // Belt-and-suspenders check: the button is already hidden for the
        // request's own creator (see the render below), but guard the
        // actual write too in case this ever gets called some other way.
        if (userId === need.user_id) {
            setError("You can't help with your own request.");
            return;
        }

        if (need.type === "Resources" && resourceItems.length === 0) {
            setError("Attach at least one file or link before confirming.");
            return;
        }

        setSubmitting(true);
        setError("");

        const { error: actError } = await supabase.from("acts").insert({
            need_id: need.id,
            giver_id: userId,
            receiver_id: need.user_id,
            type: need.type,
            description: description.trim() || null,
            resources: need.type === "Resources" ? resourceItems : null,
            status: "pending",
        });

        if (actError) {
            console.error(actError);
            setError("Could not create the act.");
            setSubmitting(false);
            return;
        }

        router.push("/community");
    }

    const themeStyles = (
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
    );

    if (loading) {
        return (
            <>
                {themeStyles}
                <main className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
                    <p className="text-[var(--muted)]">Loading request…</p>
                </main>
            </>
        );
    }

    if (!need) {
        return (
            <>
                {themeStyles}
                <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6">
                    <div className="text-center">
                        <h1
                            className="text-xl text-[var(--text)]"
                            style={{ fontFamily: "Fraunces, serif" }}
                        >
                            Request not found
                        </h1>
                        <button
                            onClick={() => router.push("/community")}
                            className="mt-4 text-sm font-medium text-[var(--text)] underline"
                        >
                            Back to community
                        </button>
                    </div>
                </main>
            </>
        );
    }

    const Icon = iconForType(need.type);
    const isOwnRequest = currentUserId !== null && currentUserId === need.user_id;

    return (
        <>
            {themeStyles}
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

                    {/* Request */}
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7">
                        <div className="flex items-center gap-2 text-sm font-medium text-[var(--muted)]">
                            <Icon size={16} stroke={1.75} />
                            Someone needs help
                        </div>

                        <h1
                            className="mt-3 text-3xl leading-tight"
                            style={{ fontFamily: "Fraunces, serif" }}
                        >
                            {need.title}
                        </h1>

                        {need.description && (
                            <p className="mt-4 leading-relaxed text-[var(--muted)]">
                                {need.description}
                            </p>
                        )}

                        <span className="mt-5 inline-block rounded-full border border-[var(--border)] px-3 py-1 text-xs font-medium text-[var(--muted)]">
                            {need.type}
                        </span>
                    </div>

                    {/* Own-request notice replaces the help form entirely */}
                    {isOwnRequest ? (
                        <div className="mt-10 flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
                            <IconInfoCircle
                                size={18}
                                stroke={1.75}
                                className="mt-0.5 shrink-0 text-[var(--muted)]"
                            />
                            <div>
                                <p className="font-medium">This is your own request</p>
                                <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                                    You can't help with something you asked for yourself. Share
                                    it with the community and wait for someone else to step in.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-10">
                            <h2
                                className="text-2xl"
                                style={{ fontFamily: "Fraunces, serif" }}
                            >
                                How you can help
                            </h2>

                            {(need.type === "Knowledge" || need.type === "Time") && (
                                <>
                                    <p className="mt-2 text-[var(--muted)]">
                                        Join the meeting they've set up to give this help directly.
                                    </p>

                                    <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <IconVideo size={16} stroke={1.75} />
                                            Meeting link
                                        </div>

                                        {need.meet_link ? (
                                            <a
                                                href={need.meet_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--invert-bg)] px-4 py-3 text-sm font-medium text-[var(--invert-text)] transition hover:opacity-85"
                                            >
                                                Join meeting
                                                <IconExternalLink size={15} stroke={2} />
                                            </a>
                                        ) : (
                                            <p className="mt-3 text-sm text-[var(--muted)]">
                                                No meeting link has been added to this request yet.
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}

                            {need.type === "Resources" && (
                                <>
                                    <p className="mt-2 text-[var(--muted)]">
                                        Attach as many files or links as you're giving them.
                                    </p>

                                    <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <IconGift size={16} stroke={1.75} />
                                            Files
                                        </div>

                                        <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border)] px-4 py-6 text-sm text-[var(--muted)] transition hover:border-[var(--text)]">
                                            <input
                                                type="file"
                                                accept=".pdf,.doc,.docx,.txt"
                                                multiple
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                            <span className="flex items-center gap-2">
                                                <IconUpload size={16} stroke={1.75} />
                                                {uploading ? "Uploading…" : "Choose file(s)"}
                                            </span>
                                        </label>

                                        <div className="mt-5 flex items-center gap-2 text-sm font-medium">
                                            <IconLink size={16} stroke={1.75} />
                                            Or paste a link
                                        </div>
                                        <div className="mt-3 flex gap-2">
                                            <input
                                                type="url"
                                                value={linkInput}
                                                onChange={(e) => setLinkInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        addLink();
                                                    }
                                                }}
                                                placeholder="https://drive.google.com/... or a video link"
                                                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--text)] placeholder:text-[var(--placeholder)]"
                                            />
                                            <button
                                                type="button"
                                                onClick={addLink}
                                                className="rounded-lg border border-[var(--border)] px-4 text-sm font-medium transition hover:border-[var(--text)]"
                                            >
                                                Add
                                            </button>
                                        </div>

                                        {resourceItems.length > 0 && (
                                            <ul className="mt-5 space-y-2">
                                                {resourceItems.map((item, index) => (
                                                    <li
                                                        key={`${item.url}-${index}`}
                                                        className="flex items-center gap-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg)] px-3 py-2 text-sm"
                                                    >
                                                        {item.kind === "file" ? (
                                                            <IconFileText size={15} stroke={1.75} className="shrink-0 text-[var(--muted)]" />
                                                        ) : (
                                                            <IconLink size={15} stroke={1.75} className="shrink-0 text-[var(--muted)]" />
                                                        )}
                                                        <span className="flex-1 truncate">{item.name}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeResource(index)}
                                                            aria-label={`Remove ${item.name}`}
                                                            className="shrink-0 text-[var(--muted)] transition hover:text-[var(--text)]"
                                                        >
                                                            <IconX size={15} stroke={2} />
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* Optional note */}
                            <div className="mt-6">
                                <label className="mb-2 block text-sm font-medium">
                                    Add a note (optional)
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Anything they should know before you connect..."
                                    rows={4}
                                    className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none transition focus:border-[var(--text)] placeholder:text-[var(--placeholder)]"
                                />
                            </div>

                            {error && (
                                <p className="mt-4 text-sm text-[var(--text)]">{error}</p>
                            )}

                            <button
                                onClick={handleHelp}
                                disabled={submitting || uploading}
                                className="mt-6 w-full rounded-xl bg-[var(--invert-bg)] px-5 py-3.5 font-medium text-[var(--invert-text)] transition hover:opacity-85 disabled:opacity-50"
                            >
                                {submitting ? "Confirming…" : "Confirm help"}
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}