"use client";

import { useState, useEffect, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  IconLink,
  IconSun,
  IconMoonStars,
  IconUser,
  IconMail,
  IconArrowRight,
  IconBulb,
  IconTool,
  IconGift,
} from "@tabler/icons-react";

const FEATURES = [
  {
    icon: IconBulb,
    title: "Share what you know",
    desc: "Teach a skill, mentor someone, or pass on knowledge you've picked up.",
  },
  {
    icon: IconTool,
    title: "Lend a hand",
    desc: "Help with a task, a favour, or a bit of your time.",
  },
  {
    icon: IconGift,
    title: "Give it forward",
    desc: "Books, tools, spare resources — pass them to someone who needs them.",
  },
];

export default function Home() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDark, setIsDark] = useState(false);
  const router = useRouter();

  // Load saved theme (or system preference) on mount.
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

  async function handleEnter() {
    if (!name.trim() || !email.trim()) {
      setError("Please enter your username and email.");
      return;
    }

    setLoading(true);
    setError("");

    let userId: string;

    const { data: existingUser, error: findError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.trim())
      .maybeSingle();

    if (findError) {
      console.error(findError);
      setError("Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          name: name.trim(),
          email: email.trim(),
        })
        .select("id")
        .single();

      if (insertError || !newUser) {
        console.error(insertError);
        setError("Could not create your account.");
        setLoading(false);
        return;
      }

      userId = newUser.id;
    }

    localStorage.setItem("kindchain_user_id", userId);
    router.push("/community");
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") handleEnter();
  }

  return (
    <>
      {/*
        Theme runs on plain CSS variables, not Tailwind's `dark:` variant.
        Toggling the "dark" class on <html> flips these vars, so it works
        whether or not darkMode:"class" is set in tailwind.config.
      */}
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=Inter:wght@400;500;600&display=swap");

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

      <main className="min-h-screen bg-[var(--bg)] transition-colors duration-300">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 md:px-10">
          {/* Header */}
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[var(--text)]">
              <IconLink size={19} stroke={1.75} />
              <span
                className="text-[17px] tracking-tight"
                style={{ fontFamily: "Fraunces, serif" }}
              >
                Kind Chain
              </span>
            </div>

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
          </header>

          {/* Main content */}
          <div className="flex flex-1 flex-col items-center justify-center gap-14 py-12 md:flex-row md:items-start md:gap-20 md:py-20">
            {/* Left: story + how it works */}
            <div className="w-full max-w-md md:pt-4">
              <h1
                className="text-[2.6rem] leading-[1.1] text-[var(--text)] md:text-[3.1rem]"
                style={{ fontFamily: "Fraunces, serif" }}
              >
                What you give can help someone.
              </h1>
              <p className="mt-4 max-w-sm text-lg leading-relaxed text-[var(--muted)]">
                What you receive can keep the chain going. No money changes
                hands — just time, knowledge, and a bit of help.
              </p>

              {/* Chain-link divider: the one bold, on-theme graphic */}
              <svg
                width="140"
                height="28"
                viewBox="0 0 140 28"
                fill="none"
                className="mt-8 text-[var(--text)]"
                aria-hidden
              >
                <rect x="1" y="8" width="24" height="12" rx="6" stroke="currentColor" strokeWidth="2" />
                <rect x="19" y="4" width="24" height="20" rx="10" stroke="currentColor" strokeWidth="2" />
                <rect x="41" y="8" width="24" height="12" rx="6" stroke="currentColor" strokeWidth="2" />
                <rect x="59" y="4" width="24" height="20" rx="10" stroke="currentColor" strokeWidth="2" />
                <rect x="81" y="8" width="24" height="12" rx="6" stroke="currentColor" strokeWidth="2" />
                <rect x="99" y="4" width="24" height="20" rx="10" stroke="currentColor" strokeWidth="2" />
                <rect x="115" y="8" width="24" height="12" rx="6" stroke="currentColor" strokeWidth="2" />
              </svg>

              <ul className="mt-10 space-y-7">
                {FEATURES.map(({ icon: Icon, title, desc }) => (
                  <li key={title} className="flex gap-4 border-t border-[var(--border-soft)] pt-7 first:border-t-0 first:pt-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text)]">
                      <Icon size={18} stroke={1.75} />
                    </span>
                    <div>
                      <p
                        className="font-medium text-[var(--text)]"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        {title}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                        {desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: form card */}
            <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8">
              <p className="mb-6 text-sm text-[var(--muted)]">
                Join with username and email — takes a few seconds.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text)]">
                    User Name
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-3.5 py-3 transition focus-within:border-[var(--text)]">
                    <IconUser size={17} stroke={1.75} className="text-[var(--muted)]" />
                    <input
                      type="text"
                      placeholder="Sai"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full bg-transparent text-[var(--text)] outline-none placeholder:text-[var(--placeholder)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text)]">
                    Your email
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-3.5 py-3 transition focus-within:border-[var(--text)]">
                    <IconMail size={17} stroke={1.75} className="text-[var(--muted)]" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full bg-transparent text-[var(--text)] outline-none placeholder:text-[var(--placeholder)]"
                    />
                  </div>
                </div>

                <button
                  onClick={handleEnter}
                  disabled={loading}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--invert-bg)] px-4 py-3.5 font-medium text-[var(--invert-text)] transition hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text)] focus-visible:ring-offset-2 disabled:opacity-50"
                  style={{ colorScheme: isDark ? "dark" : "light" }}
                >
                  {loading ? "Entering…" : "Enter KindChain"}
                  {!loading && <IconArrowRight size={17} stroke={2} />}
                </button>

                {error && <p className="text-sm text-[var(--text)]">{error}</p>}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}