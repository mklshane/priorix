import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ConnectDB } from "@/lib/config/db";
import Note from "@/lib/models/Note";
import Deck from "@/lib/models/Deck";
import Flashcard from "@/lib/models/Flashcard";
import { generateFlashcardsFromText } from "@/lib/gemini";
import { assessCardDifficultyBatch } from "@/lib/ai-difficulty";

const unauthorized = () =>
	NextResponse.json({ error: "Unauthorized" }, { status: 401 });

const sanitizeTitle = (title: string) => title.trim().slice(0, 80) || "Untitled Deck";

const getText = (note: any) => {
	if (typeof note.contentText === "string" && note.contentText.trim()) {
		return note.contentText.trim();
	}

	if (typeof note.content === "string") {
		return note.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
	}

	return "";
};

export async function POST(req: NextRequest) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return unauthorized();
		}

		const body = await req.json();
		const noteId = body?.noteId;
		const previewOnly = Boolean(body?.previewOnly);
		const preferredDeckTitle = typeof body?.deckTitle === "string" ? body.deckTitle : "";

		if (!noteId || typeof noteId !== "string") {
			return NextResponse.json({ error: "noteId is required" }, { status: 400 });
		}

		await ConnectDB();

		const note = await Note.findOne({
			_id: noteId,
			user: session.user.id,
		}).lean<any>();

		if (!note) {
			return NextResponse.json({ error: "Note not found" }, { status: 404 });
		}

		const noteText = getText(note);
		if (!noteText) {
			return NextResponse.json(
				{ error: "Note has no content to convert" },
				{ status: 400 }
			);
		}

		const tempDeckId = body?.tempDeckId && typeof body.tempDeckId === "string"
			? body.tempDeckId
			: "preview-deck";

		const generated = await generateFlashcardsFromText(noteText, tempDeckId);

		if (previewOnly) {
			return NextResponse.json({
				noteId,
				title: note.title,
				total: generated.length,
				cards: generated,
			});
		}

		const deckTitle = sanitizeTitle(preferredDeckTitle || `${note.title} Deck`);

		const deck = await Deck.create({
			title: deckTitle,
			description: `Generated from note: ${note.title}`,
			user: session.user.id,
			isPublic: false,
			sourceText: noteText,
			sourceTextUpdatedAt: new Date(),
		});

		const generatedForDeck = generated.map((card) => ({
			...card,
			deck: deck._id.toString(),
		}));

		const cardsWithDifficulty = await assessCardDifficultyBatch(
			generatedForDeck.map((card) => ({ term: card.term, definition: card.definition }))
		);

		const savedCards = await Flashcard.insertMany(
			generatedForDeck.map((card, index) => ({
				deck: deck._id,
				term: card.term,
				definition: card.definition,
				estimatedDifficulty: cardsWithDifficulty[index] ?? 5,
			}))
		);

		await Deck.findByIdAndUpdate(deck._id, {
			$push: { flashcards: { $each: savedCards.map((card) => card._id) } },
		});

		return NextResponse.json({
			message: "Deck created from note",
			deckId: deck._id,
			cardCount: savedCards.length,
		});
	} catch (err: any) {
		console.error("POST /api/notes/generate-flashcards error", err);
		return NextResponse.json(
			{ error: "Failed to generate flashcards from note" },
			{ status: 500 }
		);
	}
}
