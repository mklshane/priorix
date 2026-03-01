import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { auth } from "@/auth";
import { ConnectDB } from "@/lib/config/db";
import Note from "@/lib/models/Note";

const unauthorized = () =>
	NextResponse.json({ error: "Unauthorized" }, { status: 401 });

const stripHtml = (text: string) =>
	text
		.replace(/<style[\s\S]*?<\/style>/gi, "")
		.replace(/<script[\s\S]*?<\/script>/gi, "")
		.replace(/<[^>]+>/g, " ")
		.replace(/\s+/g, " ")
		.trim();

const getNotePlainText = (note: any) => {
	const contentText = typeof note.contentText === "string" ? note.contentText : "";

	if (contentText.trim()) {
		return contentText.trim();
	}

	if (typeof note.content === "string") {
		return stripHtml(note.content);
	}

	if (note.content && typeof note.content === "object") {
		return JSON.stringify(note.content, null, 2);
	}

	return "";
};

const createPdf = async (title: string, content: string) => {
	const pdf = await PDFDocument.create();
	const font = await pdf.embedFont(StandardFonts.Helvetica);

	const lines = content.split(/\r?\n/).flatMap((line) => {
		const chunks: string[] = [];
		if (line.length <= 100) {
			return [line];
		}

		let start = 0;
		while (start < line.length) {
			chunks.push(line.slice(start, start + 100));
			start += 100;
		}

		return chunks;
	});

	let page = pdf.addPage([595, 842]);
	const { height } = page.getSize();
	const marginX = 50;
	let cursorY = height - 60;

	page.drawText(title, {
		x: marginX,
		y: cursorY,
		size: 18,
		font,
		color: rgb(0.1, 0.1, 0.1),
	});

	cursorY -= 30;

	for (const line of lines) {
		if (cursorY < 60) {
			page = pdf.addPage([595, 842]);
			cursorY = page.getSize().height - 60;
			page.drawText(line || " ", {
				x: marginX,
				y: cursorY,
				size: 11,
				font,
				color: rgb(0.2, 0.2, 0.2),
			});
			cursorY -= 16;
			continue;
		}

		page.drawText(line || " ", {
			x: marginX,
			y: cursorY,
			size: 11,
			font,
			color: rgb(0.2, 0.2, 0.2),
		});
		cursorY -= 16;
	}

	return pdf.save();
};

const createDocx = async (title: string, content: string) => {
	const doc = new Document({
		sections: [
			{
				children: [
					new Paragraph({
						text: title,
						heading: HeadingLevel.HEADING_1,
					}),
					...content.split(/\r?\n/).map(
						(line) =>
							new Paragraph({
								children: [new TextRun({ text: line || " " })],
							})
					),
				],
			},
		],
	});

	return Packer.toBuffer(doc);
};

export async function POST(req: NextRequest) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return unauthorized();
		}

		const body = await req.json();
		const noteId = body?.noteId;
		const format = body?.format;

		if (!noteId || (format !== "pdf" && format !== "docx")) {
			return NextResponse.json(
				{ error: "noteId and valid format are required" },
				{ status: 400 }
			);
		}

		await ConnectDB();

		const note = await Note.findOne({
			_id: noteId,
			user: session.user.id,
		}).lean<any>();

		if (!note) {
			return NextResponse.json({ error: "Note not found" }, { status: 404 });
		}

		const title = typeof note.title === "string" ? note.title : "Untitled Note";
		const content = getNotePlainText(note) || " ";

		if (format === "pdf") {
			const bytes = await createPdf(title, content);
			return new NextResponse(bytes, {
				headers: {
					"Content-Type": "application/pdf",
					"Content-Disposition": `attachment; filename="${title.replace(/[^a-zA-Z0-9-_]/g, "_")}.pdf"`,
				},
			});
		}

		const buffer = await createDocx(title, content);
		return new NextResponse(buffer, {
			headers: {
				"Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				"Content-Disposition": `attachment; filename="${title.replace(/[^a-zA-Z0-9-_]/g, "_")}.docx"`,
			},
		});
	} catch (err: any) {
		console.error("POST /api/notes/export error", err);
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
