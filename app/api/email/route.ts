import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json(
      { error: "Valid email is required" },
      { status: 400 }
    );
  }

  // For now, just log it. Upgrade to Supabase/Resend later.
  console.log(`[EMAIL CAPTURED] ${email} at ${new Date().toISOString()}`);

  return NextResponse.json({ ok: true });
}