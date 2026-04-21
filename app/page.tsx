"use client";

import { useState, useEffect } from "react";

const UNLOCK_KEY = "sounded_unlocked";
const USED_KEY = "sounded_used_free";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(1);
  const [samples, setSamples] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrls, setResultUrls] = useState<string[]>([]);
  const [credits, setCredits] = useState<number | null>(null);

  const [unlocked, setUnlocked] = useState(false);
  const [usedFree, setUsedFree] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState(false);

  useEffect(() => {
    setUnlocked(localStorage.getItem(UNLOCK_KEY) === "true");
    setUsedFree(localStorage.getItem(USED_KEY) === "true");
  }, []);

  useEffect(() => {
    const fetchPreflight = async () => {
      try {
        const res = await fetch(
          `/api/preflight?duration_ms=${duration * 1000}&num_samples=${samples}`
        );
        if (res.ok) {
          const data = await res.json();
          setCredits(data.credits);
        }
      } catch {
        // silently ignore
      }
    };
    fetchPreflight();
  }, [duration, samples]);

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResultUrls([]);

    try {
      const response = await fetch("/api/sfx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          duration_ms: duration * 1000,
          num_samples: samples,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Something went wrong");
      }

      const data = await response.json();
      setResultUrls(data.result_urls ?? []);

      if (!unlocked) {
        localStorage.setItem(USED_KEY, "true");
        setUsedFree(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailSubmit() {
    if (!email.includes("@")) {
      setError("Please enter a valid email");
      return;
    }
    setEmailSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Failed to submit email");

      localStorage.setItem(UNLOCK_KEY, "true");
      setUnlocked(true);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setEmailSubmitting(false);
    }
  }

  const showEmailGate = usedFree && !unlocked;

  const inputClass =
    "flex-1 rounded-none border-4 border-black bg-white px-4 py-3 text-lg font-medium placeholder:text-gray-400 focus:outline-none focus:shadow-[6px_6px_0_0_#000] transition-shadow";
  const buttonClass =
    "rounded-none border-4 border-black bg-black px-6 py-3 text-lg font-bold text-yellow-300 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_#000] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed";

  return (
<main className="min-h-screen bg-yellow-300 p-6 md:p-12">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-10">
          <h1 className="text-7xl md:text-8xl font-black tracking-tight -rotate-2 inline-block">
            SOUNDED.
          </h1>
          <p className="mt-4 text-xl font-bold">
            Type it. Hear it. Built by emin.builds.
          </p>
        </div>

        {showEmailGate ? (
          <div className="border-4 border-black bg-white p-6 shadow-[8px_8px_0_0_#000]">
            <h2 className="text-3xl font-black">ONE MORE?</h2>
            <p className="mt-2 font-medium">
              Drop your email to keep generating. No spam. Just me telling you
              when I ship the next thing.
            </p>
            <div className="mt-4 flex flex-col md:flex-row gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
                disabled={emailSubmitting}
              />
              <button
                onClick={handleEmailSubmit}
                disabled={emailSubmitting || !email.trim()}
                className={buttonClass}
              >
                {emailSubmitting ? "..." : "UNLOCK"}
              </button>
            </div>
            {error && <p className="mt-3 font-bold text-red-600">{error}</p>}
          </div>
        ) : (
          <div className="border-4 border-black bg-white p-6 shadow-[8px_8px_0_0_#000]">
            <div className="flex flex-col md:flex-row gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) handleGenerate();
                }}
                placeholder="thunder rumbling in the distance"
                className={inputClass}
                disabled={loading}
              />
              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className={buttonClass}
              >
                {loading ? "..." : "GO"}
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-black uppercase tracking-wider">
                  Duration: {duration}s
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full mt-2 accent-black"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-black uppercase tracking-wider">
                  Variations
                </label>
                <select
                  value={samples}
                  onChange={(e) => setSamples(Number(e.target.value))}
                  className="mt-2 w-full rounded-none border-4 border-black bg-white px-3 py-2 font-bold"
                  disabled={loading}
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </div>
            </div>

            {credits !== null && (
              <p className="mt-4 text-sm font-bold uppercase tracking-wider">
                Cost: {credits} credit{credits === 1 ? "" : "s"}
              </p>
            )}

            {error && (
              <p className="mt-4 font-bold text-red-600">Error: {error}</p>
            )}

            {loading && (
              <div className="mt-6 flex items-center gap-3">
                <Waveform />
                <span className="font-bold uppercase tracking-wider">
                  Cooking
                </span>
              </div>
            )}
          </div>
        )}

        {resultUrls.length > 0 && (
          <div className="mt-8 border-4 border-black bg-white p-6 shadow-[8px_8px_0_0_#000]">
            <h2 className="text-2xl font-black uppercase">Results</h2>
            <div className="mt-4 flex flex-col gap-4">
              {resultUrls.map((url, i) => (
                <div key={url}>
                  <p className="text-sm font-black uppercase tracking-wider">
                    Variation {i + 1}
                  </p>
                  <audio controls src={url} className="w-full mt-2" />
                </div>
              ))}
            </div>
          </div>
        )}

        <footer className="mt-12 text-center text-xs font-medium tracking-wider">
          <span className="lowercase">stack: next.js / tailwind / mirelo / vercel / resend</span>
          <br />
          <span className="lowercase">made for fun 🎈</span>
        </footer>

      </div>
    </main>
  );
}

function Waveform() {
  return (
    <div className="flex items-end gap-1 h-6">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="w-1.5 bg-black animate-wave"
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </div>
  );
}