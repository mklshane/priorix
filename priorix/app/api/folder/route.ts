import { NextRequest, NextResponse } from "next/server";
import * as folderController from "./controller";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const includeCounts = searchParams.get("includeCounts") === "true";
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const folders = await folderController.listFolders(userId, includeCounts);
    return NextResponse.json(folders);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, userId } = body;
    if (!name || !userId) {
      return NextResponse.json(
        { error: "name and userId are required" },
        { status: 400 }
      );
    }

    const folder = await folderController.createFolder({ name, userId });
    return NextResponse.json(folder, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
