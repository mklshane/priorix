import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import * as notesController from "../controller";

const unauthorized = () =>
	NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function GET(
	_req: NextRequest,
	{ params }: { params: Promise<{ noteId: string }> }
) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return unauthorized();
		}

		const { noteId } = await params;
		const note = await notesController.getNoteById(session.user.id, noteId);
		return NextResponse.json(note);
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

export async function PUT(
	req: NextRequest,
	{ params }: { params: Promise<{ noteId: string }> }
) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return unauthorized();
		}

		const { noteId } = await params;
		const body = await req.json();

		const updated = await notesController.updateNote({
			userId: session.user.id,
			noteId,
			title: body.title,
			folderId: body.folderId,
			content: body.content,
			contentText: body.contentText,
		});

		return NextResponse.json(updated);
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

export async function DELETE(
	_req: NextRequest,
	{ params }: { params: Promise<{ noteId: string }> }
) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return unauthorized();
		}

		const { noteId } = await params;
		const result = await notesController.deleteNote(session.user.id, noteId);
		return NextResponse.json(result);
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
