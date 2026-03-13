import { NextRequest, NextResponse } from "next/server";
import * as folderController from "../controller";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  try {
    const { folderId } = await params;
    const body = await req.json();
    const { name, userId } = body;
    if (!name || !userId) {
      return NextResponse.json(
        { error: "name and userId are required" },
        { status: 400 }
      );
    }

    const folder = await folderController.updateFolder({
      folderId,
      name,
      userId,
    });
    return NextResponse.json(folder);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  try {
    const { folderId } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const result = await folderController.deleteFolder({
      folderId,
      userId,
    });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
