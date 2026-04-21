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

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <div className="w-full max-w-xl">
        <h1 className="text-4xl font-bold">Sounded</h1>
        <p className="mt-2 text-gray-600">
          Type it. Hear it. Built by emin.builds.
        </p>

        {showEmailGate ? (
          <div className="mt-8 rounded-lg border border-gray-300 p-6">
            <h2 className="text-xl font-semibold">One more?</h2>
            <p className="mt-2 text-sm text-gray-600">
              Drop your email to keep generating. No spam. Just me telling you
              when I ship the next thing.
            </p>
            <div className="mt-4 flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 rounded-md border border-gray-300 px-3 py-2"
                disabled={emailSubmitting}
              />
              <button
                onClick={handleEmailSubmit}
                disabled={emailSubmitting || !email.trim()}
                className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
              >
                {emailSubmitting ? "Saving..." : "Unlock"}
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
        ) : (
          <>
            <div className="mt-8 flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) handleGenerate();
                }}
                placeholder="thunder rumbling in the distance"
                className="flex-1 rounded-md border border-gray-300 px-3 py-2"
                disabled={loading}
              />
              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
              >
                {loading ? "Cooking..." : "Go"}
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium">
                  Duration: {duration}s
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Variations</label>
                <select
                  value={samples}
                  onChange={(e) => setSamples(Number(e.target.value))}
                  className="mt-1 rounded-md border border-gray-300 px-3 py-2"
                  disabled={loading}
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </div>

              {credits !== null && (
                <p className="text-sm text-gray-500">
                  Estimated cost: {credits} credit{credits === 1 ? "" : "s"}
                </p>
              )}
            </div>

            {error && <p className="mt-4 text-sm text-red-600">Error: {error}</p>}

            {loading && (
              <p className="mt-8 text-sm text-gray-500">
                Mirelo is generating your sounds...
              </p>
            )}
          </>
        )}

        {resultUrls.length > 0 && (
          <div className="mt-8 flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Results</h2>
            {resultUrls.map((url, i) => (
              <div key={url} className="flex flex-col gap-2">
                <p className="text-sm text-gray-600">Variation {i + 1}</p>
                <audio controls src={url} className="w-full" />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}