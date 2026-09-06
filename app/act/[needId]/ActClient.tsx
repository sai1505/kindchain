"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Need = {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    type: string;
    status: string;
};

const helpTypes = [
    "Knowledge",
    "Time",
    "Skill",
    "Resource",
    "Guidance",
];

export default function ActClient({ needId }: { needId: string }) {
    const router = useRouter();

    const [need, setNeed] = useState<Need | null>(null);
    const [type, setType] = useState("Knowledge");
    const [description, setDescription] = useState("");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadNeed() {
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

    async function handleHelp() {
        const userId = localStorage.getItem("kindchain_user_id");

        if (!userId) {
            router.push("/");
            return;
        }

        if (!description.trim()) {
            setError("Tell them how you're going to help.");
            return;
        }

        if (!need) {
            return;
        }

        setSubmitting(true);
        setError("");

        const { error: actError } = await supabase
            .from("acts")
            .insert({
                need_id: need.id,
                giver_id: userId,
                receiver_id: need.user_id,
                type,
                description: description.trim(),
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

    if (loading) {
        return (
            <main className="min-h-screen bg-zinc-50 flex items-center justify-center">
                <p className="text-zinc-500">Loading request...</p>
            </main>
        );
    }

    if (!need) {
        return (
            <main className="min-h-screen bg-zinc-50 flex items-center justify-center px-6">
                <div className="text-center">
                    <h1 className="text-xl font-semibold">
                        Request not found
                    </h1>

                    <button
                        onClick={() => router.push("/community")}
                        className="mt-4 text-sm font-medium underline"
                    >
                        Back to community
                    </button>
                </div>
            </main>
        );
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

                {/* Request */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-7">
                    <p className="text-sm font-medium text-zinc-500">
                        Someone needs help
                    </p>

                    <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                        {need.title}
                    </h1>

                    {need.description && (
                        <p className="mt-4 leading-relaxed text-zinc-600">
                            {need.description}
                        </p>
                    )}

                    <span className="mt-5 inline-block rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium">
                        {need.type}
                    </span>
                </div>

                {/* Help form */}
                <div className="mt-10">
                    <h2 className="text-2xl font-semibold">
                        How are you going to help?
                    </h2>

                    <p className="mt-2 text-zinc-500">
                        It can be your time, knowledge, a skill, or a resource.
                    </p>

                    {/* Type */}
                    <div className="mt-8">
                        <label className="mb-3 block text-sm font-medium">
                            What are you giving?
                        </label>

                        <div className="flex flex-wrap gap-2">
                            {helpTypes.map((helpType) => (
                                <button
                                    key={helpType}
                                    type="button"
                                    onClick={() => setType(helpType)}
                                    className={`rounded-full border px-4 py-2 text-sm transition ${type === helpType
                                        ? "border-zinc-900 bg-zinc-900 text-white"
                                        : "border-zinc-200 bg-white hover:border-zinc-400"
                                        }`}
                                >
                                    {helpType}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mt-8">
                        <label className="mb-2 block text-sm font-medium">
                            Tell them how you'll help
                        </label>

                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="I'll spend 30 minutes explaining this over a call..."
                            rows={5}
                            className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-3 outline-none transition focus:border-zinc-500"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="mt-4 text-sm text-red-500">
                            {error}
                        </p>
                    )}

                    {/* Submit */}
                    <button
                        onClick={handleHelp}
                        disabled={submitting}
                        className="mt-6 w-full rounded-xl bg-zinc-900 px-5 py-3.5 font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
                    >
                        {submitting ? "Confirming..." : "Confirm Help →"}
                    </button>
                </div>
            </div>
        </main>
    );
}