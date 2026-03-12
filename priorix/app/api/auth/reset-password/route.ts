import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ConnectDB } from "@/lib/config/db";
import User from "@/lib/models/User";

export async function POST(req: Request) {
  try {
    await ConnectDB();

    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { message: "Token and password are required." },
        { status: 400 }
      );
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid or expired reset link." },
        { status: 400 }
      );
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    return NextResponse.json(
      { message: "Password reset successfully." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { message: "Failed to reset password. Please try again." },
      { status: 500 }
    );
  }
}
