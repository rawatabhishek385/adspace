import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  // Ensure this is only accessible in development mode
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const to = searchParams.get("to");

  if (!to) {
    return NextResponse.json(
      { success: false, message: "Please provide a 'to' query parameter (e.g., /api/test-email?to=test@example.com)" },
      { status: 400 }
    );
  }

  try {
    const result = await sendEmail(
      to,
      "Test SMTP Configuration",
      "<p>If you are reading this, your Nodemailer SMTP configuration is working perfectly!</p>",
      "If you are reading this, your Nodemailer SMTP configuration is working perfectly!"
    );

    if (result.success) {
      return NextResponse.json({ success: true, message: "Test email sent successfully", data: result });
    } else {
      return NextResponse.json({ success: false, message: "Failed to send email", error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error("Test email route error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
