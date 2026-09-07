"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
    IconArrowLeft,
    IconSun,
    IconMoonStars,
} from "@tabler/icons-react";

type Act = {
    id: string;
    giver_id: string;
    receiver_id: string;
    type: string;
    description: string | null;
    verified_at: string | null;
};

type User = { id: string; name: string };

type ChainLink = { act: Act; giver: User; receiver: User };

type TreeNode = {
    key: string;
    user: User;
    incomingAct: Act | null;
    children: TreeNode[];
};

type PositionedNode = {
    key: string;
    x: number;
    y: number;
    name: string;
    type: string | null;
    isYou: boolean;
};

type Edge = {
    key: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    type: string;
};

const NODE_W = 148;
const NODE_H = 60;
const H_GAP = 28;
const LEVEL_H = 118;
const PAD = 40;

export default function ChainPage() {
    const router = useRouter();

    const [chain, setChain] = useState<ChainLink[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDark, setIsDark] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("kindchain_theme");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const dark = stored ? stored === "dark" : prefersDark;
        setIsDark(dark);
        document.documentElement.classList.toggle("dark", dark);
    }, []);

    async function handleShare() {
        const url = window.location.origin;

        if (navigator.share) {
            try {
                await navigator.share({ title: "KindChain", url });
            } catch {
                // user closed the share sheet — nothing to do
            }
            return;
        }

        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    function toggleTheme() {
        const next = !isDark;
        setIsDark(next);
        document.documentElement.classList.toggle("dark", next);
        localStorage.setItem("kindchain_theme", next ? "dark" : "light");
    }

    useEffect(() => {
        async function loadChain() {
            const userId = localStorage.getItem("kindchain_user_id");
            if (!userId) {
                router.push("/");
                return;
            }

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

            const { data: acts, error: actsError } = await supabase
                .from("acts")
                .select("id, giver_id, receiver_id, type, description, verified_at")
                .eq("status", "verified")
                .order("verified_at", { ascending: true });

            if (actsError || !acts || acts.length === 0) {
                if (actsError) console.error(actsError);
                setLoading(false);
                return;
            }

            const userIds = Array.from(
                new Set(acts.flatMap((act) => [act.giver_id, act.receiver_id]))
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

            const userMap = new Map((users ?? []).map((u) => [u.id, u]));

            const links: ChainLink[] = acts
                .map((act) => {
                    const giver = userMap.get(act.giver_id);
                    const receiver = userMap.get(act.receiver_id);
                    if (!giver || !receiver) return null;
                    return { act, giver, receiver };
                })
                .filter((link): link is ChainLink => link !== null);

            setChain(links);
            setLoading(false);
        }

        loadChain();
    }, [router]);

    // Walk every outgoing act at each person, recursively — one person can
    // help several people, so this is a tree, not a single path.
    function buildChildren(personId: string, ancestry: Set<string>): TreeNode[] {
        const nextAncestry = new Set(ancestry).add(personId);
        return chain
            .filter((link) => link.act.giver_id === personId && !ancestry.has(link.receiver.id))
            .map((link) => ({
                key: link.act.id,
                user: link.receiver,
                incomingAct: link.act,
                children: buildChildren(link.receiver.id, nextAncestry),
            }));
    }

    const root: TreeNode | null = useMemo(() => {
        if (!currentUser) return null;
        const incoming = chain.find((l) => l.receiver.id === currentUser.id);
        return {
            key: incoming ? incoming.act.id : "root",
            user: currentUser,
            incomingAct: incoming ? incoming.act : null,
            children: buildChildren(currentUser.id, new Set(incoming ? [incoming.giver.id] : [])),
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser, chain]);

    // Lay the tree out into (x, y) positions + edges for the SVG graph.
    const { nodes, edges, width, height, treeSize, depth } = useMemo(() => {
        const positioned: PositionedNode[] = [];
        const edgeList: Edge[] = [];
        let maxDepthSeen = 0;

        function layout(node: TreeNode, level: number, xStart: number): { center: number; nextX: number } {
            maxDepthSeen = Math.max(maxDepthSeen, level);

            if (node.children.length === 0) {
                const center = xStart + NODE_W / 2;
                positioned.push({
                    key: node.key,
                    x: center,
                    y: level * LEVEL_H,
                    name: node.user.name,
                    type: node.incomingAct?.type ?? null,
                    isYou: node.user.id === currentUser?.id,
                });
                return { center, nextX: xStart + NODE_W + H_GAP };
            }

            let cursor = xStart;
            const childCenters: number[] = [];
            node.children.forEach((child) => {
                const { center, nextX } = layout(child, level + 1, cursor);
                childCenters.push(center);
                cursor = nextX;
            });

            const center = (childCenters[0] + childCenters[childCenters.length - 1]) / 2;
            positioned.push({
                key: node.key,
                x: center,
                y: level * LEVEL_H,
                name: node.user.name,
                type: node.incomingAct?.type ?? null,
                isYou: node.user.id === currentUser?.id,
            });

            node.children.forEach((child, i) => {
                edgeList.push({
                    key: `${node.key}-${child.key}`,
                    x1: center,
                    y1: level * LEVEL_H + NODE_H,
                    x2: childCenters[i],
                    y2: (level + 1) * LEVEL_H,
                    type: child.incomingAct?.type ?? "",
                });
            });

            return { center, nextX: cursor };
        }

        let treeWidth = NODE_W;
        let count = 0;

        function countNodes(n: TreeNode): number {
            return 1 + n.children.reduce((sum, c) => sum + countNodes(c), 0);
        }

        if (root) {
            const result = layout(root, 0, 0);
            treeWidth = Math.max(result.nextX - H_GAP, NODE_W);
            count = countNodes(root);
        }

        return {
            nodes: positioned,
            edges: edgeList,
            width: treeWidth + PAD * 2,
            height: (maxDepthSeen + 1) * LEVEL_H + PAD,
            treeSize: count,
            depth: maxDepthSeen,
        };
    }, [root, currentUser]);

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
                <p className="text-[var(--muted)]">Following your kindness…</p>
            </main>
        );
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
                <div className="mx-auto max-w-4xl px-6 py-10">
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
                            {isDark ? <IconSun size={17} stroke={1.75} /> : <IconMoonStars size={17} stroke={1.75} />}
                        </button>
                    </div>

                    {/* Hero */}
                    <div className="mb-10 text-center">
                        <p className="text-sm font-medium uppercase tracking-widest text-[var(--muted)]">
                            Your impact
                        </p>
                        <h1
                            className="mt-4 text-4xl leading-tight sm:text-5xl"
                            style={{ fontFamily: "Fraunces, serif" }}
                        >
                            Your kindness
                            <br />
                            keeps spreading.
                        </h1>
                        <p className="mx-auto mt-4 max-w-xl text-lg text-[var(--muted)]">
                            Every act creates a possibility for another act.
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="mb-12 grid grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
                            <p className="text-4xl" style={{ fontFamily: "Fraunces, serif" }}>
                                {depth}
                            </p>
                            <p className="mt-2 text-sm text-[var(--muted)]">generations deep</p>
                        </div>
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
                            <p className="text-4xl" style={{ fontFamily: "Fraunces, serif" }}>
                                {treeSize}
                            </p>
                            <p className="mt-2 text-sm text-[var(--muted)]">people in your network</p>
                        </div>
                    </div>

                    {/* Graph */}
                    <div className="mb-6">
                        <h2 className="text-2xl" style={{ fontFamily: "Fraunces, serif" }}>
                            Your network
                        </h2>
                        <p className="mt-1 text-[var(--muted)]">
                            Everyone your kindness reached, and everyone it reached after that.
                        </p>
                    </div>

                    {!root || root.children.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center">
                            <p className="font-medium">Your network is just beginning.</p>
                            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
                                Once someone you helped pays it forward, the graph will branch here.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
                            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="mx-auto">
                                {edges.map((edge) => (
                                    <path
                                        key={edge.key}
                                        d={`M ${edge.x1 + PAD} ${edge.y1 + PAD} C ${edge.x1 + PAD} ${edge.y1 + PAD + 30
                                            }, ${edge.x2 + PAD} ${edge.y2 + PAD - 30}, ${edge.x2 + PAD} ${edge.y2 + PAD}`}
                                        fill="none"
                                        stroke="var(--border)"
                                        strokeWidth={1.5}
                                    />
                                ))}

                                {nodes.map((node) => (
                                    <g key={node.key} transform={`translate(${node.x + PAD - NODE_W / 2}, ${node.y + PAD})`}>
                                        <rect
                                            width={NODE_W}
                                            height={NODE_H}
                                            rx={12}
                                            fill={node.isYou ? "var(--invert-bg)" : "var(--surface)"}
                                            stroke={node.isYou ? "var(--invert-bg)" : "var(--border)"}
                                            strokeWidth={1}
                                        />
                                        <text
                                            x={NODE_W / 2}
                                            y={NODE_H / 2 - 8}
                                            textAnchor="middle"
                                            fontSize="13"
                                            fontWeight={600}
                                            fill={node.isYou ? "var(--invert-text)" : "var(--text)"}
                                        >
                                            {node.name.length > 16 ? `${node.name.slice(0, 15)}…` : node.name}
                                            {node.isYou ? " (you)" : ""}
                                        </text>
                                        {node.type && (
                                            <text
                                                x={NODE_W / 2}
                                                y={NODE_H / 2 + 12}
                                                textAnchor="middle"
                                                fontSize="11"
                                                fill={node.isYou ? "var(--invert-text)" : "var(--muted)"}
                                                opacity={node.isYou ? 0.75 : 1}
                                            >
                                                {node.type}
                                            </text>
                                        )}
                                    </g>
                                ))}
                            </svg>
                        </div>
                    )}

                    {/* Share KindChain */}
                    <div className="mt-14 rounded-3xl bg-[var(--invert-bg)] p-8 text-center text-[var(--invert-text)]">
                        <p className="text-sm font-medium tracking-wide opacity-70">KINDCHAIN</p>

                        <h2 className="mt-3 text-3xl" style={{ fontFamily: "Fraunces, serif" }}>
                            Pass it forward.
                        </h2>

                        <p className="mx-auto mt-3 max-w-md leading-relaxed opacity-80">
                            Share the link and help someone else start their own chain.
                        </p>

                        <div className="mx-auto mt-6 flex max-w-sm items-center gap-2 rounded-xl border border-white/15 bg-white/5 p-1.5">
                            <span className="flex-1 truncate px-3 text-left text-sm opacity-80">
                                {typeof window !== "undefined" ? window.location.origin : "kindchain.app"}
                            </span>
                            <button
                                onClick={handleShare}
                                className="shrink-0 rounded-lg bg-[var(--invert-text)] px-4 py-2 text-sm font-medium text-[var(--invert-bg)] transition hover:opacity-85"
                            >
                                {copied ? "Copied!" : "Share"}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}