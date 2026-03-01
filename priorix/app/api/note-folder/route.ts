import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import * as controller from "./controller";

const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const { searchParams } = new URL(req.url);
    const includeCounts = searchParams.get("includeCounts") === "true";

    const folders = await controller.listNoteFolders(
      session.user.id,
      includeCounts
    );

    return NextResponse.json(folders);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const body = await req.json();
    if (!body?.name || typeof body.name !== "string") {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const folder = await controller.createNoteFolder({
      userId: session.user.id,
      name: body.name,
    });

    return NextResponse.json(folder, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
