"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollText, Sparkles } from "lucide-react";

interface FlashcardPreview {
	term: string;
	definition: string;
}

interface LinkedFlashcardsProps {
	cards: FlashcardPreview[];
	isLoading: boolean;
	onGeneratePreview: () => void;
	onCreateDeck: () => void;
	isCreatePending?: boolean;
}

export default function LinkedFlashcards({
	cards,
	isLoading,
	onGeneratePreview,
	onCreateDeck,
	isCreatePending,
}: LinkedFlashcardsProps) {
	return (
		<Card className="border-border/60 bg-card/80">
			<CardHeader className="space-y-1 pb-3">
				<CardTitle className="flex items-center gap-2 text-base">
					<ScrollText className="h-4 w-4" />
					Flashcard Conversion
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				<Button onClick={onGeneratePreview} disabled={isLoading} variant="outline" className="w-full">
					<Sparkles className="mr-2 h-4 w-4" />
					{isLoading ? "Generating preview..." : "Generate card preview"}
				</Button>

				<Button onClick={onCreateDeck} disabled={isCreatePending || cards.length === 0} className="w-full">
					{isCreatePending ? "Creating deck..." : "Create deck from preview"}
				</Button>

				{cards.length > 0 ? (
					<div className="max-h-72 space-y-2 overflow-y-auto rounded-md border border-border/50 p-2">
						{cards.slice(0, 10).map((card, index) => (
							<div key={`${card.term}-${index}`} className="rounded-md border border-border/50 p-2">
								<p className="text-sm font-semibold">{card.term}</p>
								<p className="text-xs text-muted-foreground">{card.definition}</p>
							</div>
						))}
					</div>
				) : (
					<p className="text-xs text-muted-foreground">
						Generate a preview to inspect cards before creating a deck.
					</p>
				)}
			</CardContent>
		</Card>
	);
}
