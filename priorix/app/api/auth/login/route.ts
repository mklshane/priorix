import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ConnectDB } from "@/lib/config/db";
import User from "@/lib/models/User";

export async function POST(req: Request) {
  try {
    await ConnectDB();

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { message: "No account found with this email." },
        { status: 401 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { message: "This email is linked to a Google account. Please sign in with Google." },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { message: "Incorrect password." },
        { status: 401 }
      );
    }

    return NextResponse.json({ message: "OK" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
