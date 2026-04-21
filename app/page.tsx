"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(1);
  const [samples, setSamples] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrls, setResultUrls] = useState<string[]>([]);
  const [credits, setCredits] = useState<number | null>(null);

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
        // silently ignore preflight errors
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <div className="w-full max-w-xl">
        <h1 className="text-4xl font-bold">Sounded</h1>
        <p className="mt-2 text-gray-600">
          Type it. Hear it. Built by emin.builds.
        </p>

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
            <label className="block text-sm font-medium">
              Variations
            </label>
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

        {error && (
          <p className="mt-4 text-sm text-red-600">Error: {error}</p>
        )}

        {loading && (
          <p className="mt-8 text-sm text-gray-500">
            Mirelo is generating your sounds...
          </p>
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