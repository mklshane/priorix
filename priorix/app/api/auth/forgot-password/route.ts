import { NextResponse } from "next/server";
import crypto from "crypto";
import { ConnectDB } from "@/lib/config/db";
import User from "@/lib/models/User";
import { sendResetEmail } from "@/lib/config/mail";

export async function POST(req: Request) {
  try {
    await ConnectDB();

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required." },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { message: "No account found with this email." },
        { status: 404 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { message: "This email is linked to a Google account. Please sign in with Google." },
        { status: 400 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    await sendResetEmail(email, resetUrl);

    return NextResponse.json(
      { message: "Password reset link sent to your email." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { message: "Failed to send reset email. Please try again." },
      { status: 500 }
    );
  }
}
