import { NextResponse } from "next/server";
import Deck from "@/lib/models/Deck";
import { ConnectDB } from "@/lib/config/db";


export async function DELETE(
  req: Request,
  { params }: { params: { deckId: string } }
) {
  await ConnectDB();
  const { deckId } = params;

  try {
    const deleted = await Deck.findByIdAndDelete(deckId);
    if (!deleted)
      return NextResponse.json({ message: "Deck not found" }, { status: 404 });
    return NextResponse.json({
      message: "Deck deleted successfully",
      deck: deleted,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Error deleting deck", error },
      { status: 500 }
    );
  }
}
