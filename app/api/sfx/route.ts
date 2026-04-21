import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { prompt } = await request.json();

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json(
      { error: "prompt is required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.MIRELO_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server misconfigured: missing MIRELO_API_KEY" },
      { status: 500 }
    );
  }

  const mireloResponse = await fetch(
    "https://api.mirelo.ai/v2/text-to-sfx/v1.5/sync",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt,
        duration_ms: 5000,
        num_samples: 3,
      }),
    }
  );

  if (!mireloResponse.ok) {
    const errorText = await mireloResponse.text();
    return NextResponse.json(
      { error: "Mirelo API error", details: errorText },
      { status: mireloResponse.status }
    );
  }

  const data = await mireloResponse.json();
  return NextResponse.json(data);
}