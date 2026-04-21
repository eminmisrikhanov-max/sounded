import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const duration_ms = searchParams.get("duration_ms") ?? "1000";
  const num_samples = searchParams.get("num_samples") ?? "1";

  const apiKey = process.env.MIRELO_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 }
    );
  }

  const mireloResponse = await fetch(
    `https://api.mirelo.ai/v2/text-to-sfx/v1.5/preflight?duration_ms=${duration_ms}&num_samples=${num_samples}`,
    {
      headers: { Authorization: `Bearer ${apiKey}` },
    }
  );

  if (!mireloResponse.ok) {
    const errorText = await mireloResponse.text();
    return NextResponse.json(
      { error: "Preflight failed", details: errorText },
      { status: mireloResponse.status }
    );
  }

  const data = await mireloResponse.json();
  return NextResponse.json(data);
}