import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ConnectDB } from "@/lib/config/db";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ConnectDB();
    const user = await User.findById(session.user.id).lean() as any;
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      isOAuthUser: !user.password,
    });
  } catch (err: any) {
    console.error("GET /api/user/profile error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, currentPassword, newPassword } = body;

    await ConnectDB();
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      }
      if (name.trim().length > 100) {
        return NextResponse.json({ error: "Name must be 100 characters or fewer" }, { status: 400 });
      }
      user.name = name.trim();
    }

    if (currentPassword !== undefined || newPassword !== undefined) {
      if (!user.password) {
        return NextResponse.json({ error: "Password change is not available for OAuth accounts" }, { status: 400 });
      }
      if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: "Both current and new password are required" }, { status: 400 });
      }
      if (newPassword.length < 8) {
        return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
      }
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    return NextResponse.json({ success: true, name: user.name });
  } catch (err: any) {
    console.error("PUT /api/user/profile error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
