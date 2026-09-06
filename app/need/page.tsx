"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const categories = [
    "Knowledge",
    "Time",
    "Skill",
    "Physical resource",
    "Guidance",
    "Transportation",
    "Opportunity",
    "Other",
];

export default function NeedPage() {
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState("Knowledge");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit() {
        if (!title.trim() || !description.trim()) {
            setError("Please tell us what you need.");
            return;
        }

        setLoading(true);
        setError("");

        /*
          For now we're using the first user in the database.
          We'll replace this with proper user/session handling
          shortly.
        */

        const userId = localStorage.getItem("kindchain_user_id");

        if (!userId) {
            router.push("/");
            return;
        }

        const { error: needError } = await supabase
            .from("needs")
            .insert({
                user_id: userId,
                title: title.trim(),
                description: description.trim(),
                type,
                status: "open",
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
        <main className="min-h-screen bg-zinc-50 text-zinc-900">
            <div className="mx-auto max-w-2xl px-6 py-10">

                {/* Back */}
                <button
                    onClick={() => router.push("/community")}
                    className="mb-10 text-sm font-medium text-zinc-500 hover:text-zinc-900"
                >
                    ← Back to community
                </button>

                {/* Heading */}
                <div className="mb-10">
                    <h1 className="text-4xl font-semibold tracking-tight">
                        What do you need?
                    </h1>

                    <p className="mt-3 text-lg text-zinc-500">
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
                            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 outline-none transition focus:border-zinc-500"
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
                            className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-3 outline-none transition focus:border-zinc-500"
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="mb-3 block text-sm font-medium">
                            Category
                        </label>

                        <div className="flex flex-wrap gap-2">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    type="button"
                                    onClick={() => setType(category)}
                                    className={`rounded-full border px-4 py-2 text-sm transition ${type === category
                                        ? "border-zinc-900 bg-zinc-900 text-white"
                                        : "border-zinc-200 bg-white hover:border-zinc-400"
                                        }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-sm text-red-500">
                            {error}
                        </p>
                    )}

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full rounded-xl bg-zinc-900 px-5 py-3.5 font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
                    >
                        {loading ? "Posting..." : "Post to KINDCHAIN →"}
                    </button>

                </div>
            </div>
        </main>
    );
}