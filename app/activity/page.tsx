"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Act = {
    id: string;
    giver_id: string;
    receiver_id: string;
    need_id: string;
    type: string;
    description: string;
    status: string;
    created_at: string;
};

export default function ActivityPage() {
    const router = useRouter();

    const [acts, setActs] = useState<Act[]>([]);
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState<string | null>(null);
    const [error, setError] = useState("");

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
            .update({
                status: "fulfilled",
            })
            .eq("id", act.need_id);

        if (needError) {
            console.error(needError);
        }

        setActs((current) =>
            current.filter((item) => item.id !== act.id)
        );

        setConfirming(null);
    }

    return (
        <main className="min-h-screen bg-zinc-50 text-zinc-900">
            <header className="border-b border-zinc-200 bg-white">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
                    <h1 className="text-xl font-bold">
                        KINDCHAIN
                    </h1>

                    <button
                        onClick={() => router.push("/community")}
                        className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
                    >
                        Community →
                    </button>
                </div>
            </header>

            <div className="mx-auto max-w-3xl px-6 py-12">

                <h2 className="text-3xl font-semibold tracking-tight">
                    Your activity
                </h2>

                <p className="mt-2 text-zinc-500">
                    See how help is moving through the community.
                </p>

                {error && (
                    <p className="mt-6 text-sm text-red-500">
                        {error}
                    </p>
                )}

                {loading && (
                    <p className="mt-10 text-zinc-500">
                        Loading...
                    </p>
                )}

                {!loading && acts.length === 0 && (
                    <div className="mt-10 rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
                        <p className="font-medium">
                            Nothing waiting for confirmation.
                        </p>

                        <p className="mt-2 text-sm text-zinc-500">
                            When someone helps you, it will appear here.
                        </p>
                    </div>
                )}

                <div className="mt-8 space-y-5">
                    {acts.map((act) => (
                        <article
                            key={act.id}
                            className="rounded-2xl border border-zinc-200 bg-white p-6"
                        >
                            <p className="text-sm font-medium text-zinc-500">
                                Someone helped you
                            </p>

                            <h3 className="mt-3 text-xl font-semibold">
                                {act.type}
                            </h3>

                            <p className="mt-3 leading-relaxed text-zinc-600">
                                {act.description}
                            </p>

                            <button
                                onClick={() => confirmHelp(act)}
                                disabled={confirming === act.id}
                                className="mt-6 w-full rounded-xl bg-zinc-900 px-5 py-3 font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                            >
                                {confirming === act.id
                                    ? "Confirming..."
                                    : "Yes, I received the help →"}
                            </button>
                        </article>
                    ))}
                </div>

            </div>
        </main>
    );
}