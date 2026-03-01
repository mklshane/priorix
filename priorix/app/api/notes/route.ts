import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import * as notesController from "./controller";

const unauthorized = () =>
	NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function GET(req: NextRequest) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return unauthorized();
		}

		const { searchParams } = new URL(req.url);
		const folderParam = searchParams.get("folderId");
		const folderId =
			folderParam === null
				? undefined
				: folderParam === "null"
				? null
				: folderParam;

		const search = searchParams.get("search") ?? undefined;
		const sortBy =
			(searchParams.get("sortBy") as notesController.NoteSortBy | null) ??
			"date";

		const notes = await notesController.listNotes({
			userId: session.user.id,
			folderId,
			search,
			sortBy,
		});

		return NextResponse.json(notes);
	} catch (err: any) {
		console.error("GET /api/notes error", err);
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

		if (!body?.title || typeof body.title !== "string") {
			return NextResponse.json({ error: "title is required" }, { status: 400 });
		}

		const note = await notesController.createNote({
			userId: session.user.id,
			title: body.title,
			folderId: body.folderId,
			content: body.content,
			contentText: body.contentText,
		});

		return NextResponse.json(note, { status: 201 });
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
