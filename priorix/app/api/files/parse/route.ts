import { NextResponse } from "next/server";
import mammoth from "mammoth";
import JSZip from "jszip";
import crypto from "node:crypto";

// This route needs Node APIs (Buffer, pdf-parse, mammoth), so force Node runtime.
export const runtime = "nodejs";

// pdfjs requires a dummy DOMMatrix in Node environments. Provide a minimal stub.
if (typeof (globalThis as any).DOMMatrix === "undefined") {
  (globalThis as any).DOMMatrix = class {
    a = 1;
    b = 0;
    c = 0;
    d = 1;
    e = 0;
    f = 0;
    constructor(_: any = undefined) {}
    multiply(other: any) {
      return other || this;
    }
    translate() {
      return this;
    }
    scale() {
      return this;
    }
    rotate() {
      return this;
    }
  } as any;
}

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

const ALLOWED_EXTENSIONS = new Set(["docx", "ppt", "pptx", "txt"]);

type ParsedPage = {
  index: number;
  title: string;
  snippet: string;
  text: string;
};

type ParsedFile = {
  fileId: string;
  fileName: string;
  fileType: string;
  pages: ParsedPage[];
};

const normalize = (text: string) => text.replace(/\s+/g, " ").trim();

const snippet = (text: string, limit = 220) => {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit).trim()}...`;
};

const chunkByWords = (segments: string[], wordsPerChunk = 180) => {
  const chunks: string[] = [];
  let buffer: string[] = [];

  segments.forEach((segment) => {
    const words = segment.split(/\s+/).filter(Boolean);
    buffer.push(...words);
    while (buffer.length >= wordsPerChunk) {
      chunks.push(buffer.splice(0, wordsPerChunk).join(" "));
    }
  });

  if (buffer.length) {
    chunks.push(buffer.join(" "));
  }

  return chunks;
};

async function parseDocx(buffer: Buffer): Promise<string[]> {
  const { value } = await mammoth.extractRawText({ buffer });
  const paragraphs = value
    .split(/\n{2,}/)
    .map(normalize)
    .filter(Boolean);

  if (!paragraphs.length) return [];

  return chunkByWords(paragraphs, 180);
}

async function parseTxt(buffer: Buffer): Promise<string[]> {
  const content = buffer.toString("utf-8");
  const sections = content
    .split(/\n{2,}/)
    .map(normalize)
    .filter(Boolean);

  if (!sections.length) return [];

  return chunkByWords(sections, 200);
}

async function parsePptx(buffer: Buffer): Promise<string[]> {
  const zip = await JSZip.loadAsync(buffer);
  const slideNames = Object.keys(zip.files)
    .filter((name) => name.startsWith("ppt/slides/slide") && name.endsWith(".xml"))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] || "0", 10);
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] || "0", 10);
      return numA - numB;
    });

  const slides: string[] = [];

  for (const name of slideNames) {
    const file = zip.file(name);
    if (!file) continue;
    const xml = await file.async("text");
    const textPieces = Array.from(xml.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g)).map(
      (match) => match[1]
    );
    const slideText = normalize(textPieces.join(" "));
    if (slideText) {
      slides.push(slideText);
    }
  }

  return slides;
}

function buildPages(pages: string[], label: (i: number) => string): ParsedPage[] {
  return pages.map((text, index) => ({
    index,
    title: label(index),
    snippet: snippet(text),
    text,
  }));
}

function getExtension(fileName: string) {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() || "" : "";
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const entries = form.getAll("files").filter((f) => f instanceof File) as File[];

    if (!entries.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const parsedFiles: ParsedFile[] = [];
    const errors: { fileName: string; error: string }[] = [];

    for (const file of entries) {
      const ext = getExtension(file.name);
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        errors.push({ fileName: file.name, error: `Unsupported file type: ${ext}` });
        continue;
      }

      if (ext === "pdf") {
        errors.push({ fileName: file.name, error: "PDF parsing is handled on the client." });
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push({ fileName: file.name, error: "File too large" });
        continue;
      }

      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        let pages: string[] = [];

        if (ext === "docx") {
          pages = await parseDocx(buffer);
        } else if (ext === "pptx" || ext === "ppt") {
          pages = await parsePptx(buffer);
        } else if (ext === "txt") {
          pages = await parseTxt(buffer);
        }

        const cleanedPages = pages.map(normalize).filter(Boolean);

        if (!cleanedPages.length) {
          errors.push({ fileName: file.name, error: "No readable text found" });
          continue;
        }

        const labelBase = ext.startsWith("ppt") ? "Slide" : "Page";

        parsedFiles.push({
          fileId: crypto.randomUUID(),
          fileName: file.name,
          fileType: ext,
          pages: buildPages(cleanedPages, (i) => `${labelBase} ${i + 1}`),
        });
      } catch (error) {
        console.error("Parse failed for", file.name, error);
        errors.push({
          fileName: file.name,
          error: error instanceof Error ? error.message : "Failed to parse file",
        });
      }
    }

    if (!parsedFiles.length) {
      return NextResponse.json(
        { error: "Failed to parse files", details: errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ files: parsedFiles, errors }, { status: 200 });
  } catch (error) {
    console.error("File parse error", error);
    return NextResponse.json({ error: "Failed to parse files" }, { status: 500 });
  }
}
