import NoteEditor from "@/components/Notes/NoteEditor";

interface NoteEditorPageProps {
  params: Promise<{ noteId: string }>;
}

export default async function NoteEditorPage({ params }: NoteEditorPageProps) {
  const { noteId } = await params;

  return <NoteEditor noteId={noteId} />;
}
