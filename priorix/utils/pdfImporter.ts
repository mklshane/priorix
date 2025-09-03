// utils/pdfImporter.ts
import { IFlashcard } from "@/types/flashcard";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";

GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";


export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();

  // Load the PDF
  const pdf = await getDocument({ data: arrayBuffer }).promise;

  let fullText = "";

  // Loop through pages
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);

    // Get text content
    const textContent = await page.getTextContent();

    // Extract strings
    const pageText = textContent.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ");

    fullText += pageText + "\n\n";
  }

  if (!fullText.trim()) {
    throw new Error("No text could be extracted from the PDF");
  }

  return fullText;
}


export async function importPDF(file: File, deckId: string) {
  // Step 1: Extract text client-side
  const text = await extractTextFromPDF(file);

  // Step 2: Send to backend (keeps API key secure)
  const response = await fetch("/api/ai/generate-and-save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, deckId }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to generate flashcards");
  }

  return response.json();
}
