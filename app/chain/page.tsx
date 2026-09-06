"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Act = {
    id: string;
    giver_id: string;
    receiver_id: string;
    type: string;
    description: string | null;
    verified_at: string | null;
};

type User = {
    id: string;
    name: string;
};

type ChainLink = {
    act: Act;
    giver: User;
    receiver: User;
};

export default function ChainPage() {
    const router = useRouter();

    const [chain, setChain] = useState<ChainLink[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadChain() {
            const userId = localStorage.getItem("kindchain_user_id");

            if (!userId) {
                router.push("/");
                return;
            }

            // Current user
            const { data: user } = await supabase
                .from("users")
                .select("id, name")
                .eq("id", userId)
                .single();

            if (!user) {
                router.push("/");
                return;
            }

            setCurrentUser(user);

            // All verified acts
            const { data: acts, error: actsError } = await supabase
                .from("acts")
                .select(
                    "id, giver_id, receiver_id, type, description, verified_at"
                )
                .eq("status", "verified")
                .order("verified_at", { ascending: true });

            if (actsError) {
                console.error(actsError);
                setLoading(false);
                return;
            }

            if (!acts || acts.length === 0) {
                setLoading(false);
                return;
            }

            // Get all users involved in the chain
            const userIds = Array.from(
                new Set(
                    acts.flatMap((act) => [
                        act.giver_id,
                        act.receiver_id,
                    ])
                )
            );

            const { data: users, error: usersError } = await supabase
                .from("users")
                .select("id, name")
                .in("id", userIds);

            if (usersError) {
                console.error(usersError);
                setLoading(false);
                return;
            }

            const userMap = new Map(
                (users ?? []).map((user) => [user.id, user])
            );

            const links: ChainLink[] = acts
                .map((act) => {
                    const giver = userMap.get(act.giver_id);
                    const receiver = userMap.get(act.receiver_id);

                    if (!giver || !receiver) {
                        return null;
                    }

                    return {
                        act,
                        giver,
                        receiver,
                    };
                })
                .filter(
                    (link): link is ChainLink => link !== null
                );

            setChain(links);
            setLoading(false);
        }

        loadChain();
    }, [router]);

    /*
     * Build the chain around the current user.
     *
     * We start with acts where the current user RECEIVED help,
     * then follow acts where that receiver later became a GIVER.
     */

    const forwardChain: ChainLink[] = [];

    if (currentUser) {
        let personId = currentUser.id;

        const visited = new Set<string>();

        while (!visited.has(personId)) {
            visited.add(personId);

            const link = chain.find(
                (item) =>
                    item.act.giver_id === personId &&
                    !visited.has(item.act.receiver_id)
            );

            if (!link) {
                break;
            }

            forwardChain.push(link);
            personId = link.receiver.id;
        }
    }

    const kindnessGenerations = forwardChain.length;

    if (loading) {
        return (
            <main className="min-h-screen bg-zinc-50 flex items-center justify-center">
                <p className="text-zinc-500">
                    Following your kindness...
                </p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-zinc-50 text-zinc-900">

            {/* Header */}

            <header className="border-b border-zinc-200 bg-white">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">

                    <button
                        onClick={() => router.push("/community")}
                        className="text-xl font-bold tracking-tight"
                    >
                        KINDCHAIN
                    </button>

                    <button
                        onClick={() => router.push("/community")}
                        className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
                    >
                        Community →
                    </button>

                </div>
            </header>

            <div className="mx-auto max-w-3xl px-6 py-12">

                {/* Hero */}

                <section className="text-center">

                    <p className="text-sm font-medium uppercase tracking-widest text-zinc-400">
                        Your impact
                    </p>

                    <h1 className="mt-4 text-5xl font-bold tracking-tight">
                        Your kindness
                        <br />
                        keeps moving.
                    </h1>

                    <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-zinc-500">
                        Every act creates a possibility for another act.
                    </p>

                </section>

                {/* Stats */}

                <section className="mt-12 grid grid-cols-2 gap-4">

                    <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center">
                        <p className="text-4xl font-bold">
                            {kindnessGenerations}
                        </p>

                        <p className="mt-2 text-sm text-zinc-500">
                            generations of kindness
                        </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center">
                        <p className="text-4xl font-bold">
                            {forwardChain.length + 1}
                        </p>

                        <p className="mt-2 text-sm text-zinc-500">
                            people in your chain
                        </p>
                    </div>

                </section>

                {/* Chain */}

                <section className="mt-14">

                    <div className="mb-8">
                        <h2 className="text-2xl font-semibold">
                            Your chain
                        </h2>

                        <p className="mt-1 text-zinc-500">
                            See where one act of kindness led.
                        </p>
                    </div>

                    {forwardChain.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">

                            <div className="text-4xl">
                                🌱
                            </div>

                            <h3 className="mt-4 text-lg font-semibold">
                                Your chain is just beginning.
                            </h3>

                            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
                                Once someone you helped pays the kindness
                                forward, you'll see the chain grow here.
                            </p>

                        </div>
                    ) : (
                        <div className="relative">

                            {/* Vertical line */}

                            <div className="absolute left-6 top-8 bottom-8 w-px bg-zinc-200" />

                            <div className="space-y-6">

                                {forwardChain.map((link, index) => (
                                    <div
                                        key={link.act.id}
                                        className="relative flex gap-5"
                                    >

                                        {/* Node */}

                                        <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white font-semibold">
                                            {index + 1}
                                        </div>

                                        {/* Card */}

                                        <div className="flex-1 rounded-2xl border border-zinc-200 bg-white p-5">

                                            <div className="flex items-center justify-between gap-4">

                                                <div>
                                                    <p className="font-semibold">
                                                        {link.giver.name}
                                                    </p>

                                                    <p className="text-sm text-zinc-400">
                                                        helped
                                                    </p>

                                                    <p className="mt-1 font-semibold">
                                                        {link.receiver.name}
                                                    </p>
                                                </div>

                                                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium">
                                                    {link.act.type}
                                                </span>

                                            </div>

                                            {link.act.description && (
                                                <p className="mt-4 text-sm leading-relaxed text-zinc-500">
                                                    {link.act.description}
                                                </p>
                                            )}

                                        </div>

                                    </div>
                                ))}

                            </div>

                        </div>
                    )}

                </section>

                {/* Pass it forward */}

                <section className="mt-14 rounded-3xl bg-zinc-900 p-8 text-center text-white">

                    <p className="text-sm font-medium text-zinc-400">
                        KINDCHAIN
                    </p>

                    <h2 className="mt-3 text-3xl font-semibold">
                        Someone helped you.
                    </h2>

                    <p className="mx-auto mt-3 max-w-lg leading-relaxed text-zinc-400">
                        You don't owe them anything.
                        <br />
                        Just pass it forward.
                    </p>

                    <button
                        onClick={() => router.push("/community")}
                        className="mt-7 rounded-xl bg-white px-6 py-3 font-medium text-zinc-900 transition hover:bg-zinc-200"
                    >
                        Pass it forward →
                    </button>

                </section>

            </div>
        </main>
    );
}