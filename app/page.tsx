"use client";

import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrls, setResultUrls] = useState<string[]>([]);

  async function handleGenerate() {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setResultUrls([]);

    try {
      const response = await fetch("/api/sfx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
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
          Describe a sound. Get three AI-generated variations.
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
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600">Error: {error}</p>
        )}

        {loading && (
          <p className="mt-8 text-sm text-gray-500">
            Mirelo is generating your sounds. This takes ~10 seconds.
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