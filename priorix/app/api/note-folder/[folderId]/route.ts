import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import * as controller from "../controller";

const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function PATCH(
  req: NextRequest,
  { params }: { params: { folderId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const body = await req.json();
    if (!body?.name || typeof body.name !== "string") {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const folder = await controller.updateNoteFolder({
      userId: session.user.id,
      folderId: params.folderId,
      name: body.name,
    });

    return NextResponse.json(folder);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { folderId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const result = await controller.deleteNoteFolder({
      userId: session.user.id,
      folderId: params.folderId,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
