import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json(
      { error: "Valid email is required" },
      { status: 400 }
    );
  }

  // Log it (still useful as a backup)
  console.log(`[EMAIL CAPTURED] ${email} at ${new Date().toISOString()}`);

  // Notify yourself
  try {
    await resend.emails.send({
      from: "Sounded <onboarding@resend.dev>",
      to: process.env.NOTIFY_EMAIL ?? "",
      subject: "New Sounded signup 🎉",
      html: `<p>Someone just gave their email to unlock Sounded.</p>
             <p><strong>${email}</strong></p>
             <p>Time: ${new Date().toISOString()}</p>`,
    });
  } catch (err) {
    // Don't block the user if notification fails
    console.error("Failed to send notification:", err);
  }

  return NextResponse.json({ ok: true });
}