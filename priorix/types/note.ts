export interface NoteFolder {
  _id: string;
  name: string;
  user: string;
  createdAt: string;
  updatedAt: string;
  noteCount?: number;
}

export interface Note {
  _id: string;
  title: string;
  content: unknown;
  contentText: string;
  excerpt?: string;
  user: string;
  folder?: string | NoteFolder | null;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  lastOpenedAt?: string | null;
}

export interface CreateNoteRequest {
  title: string;
  folderId?: string | null;
  content?: unknown;
}

export interface UpdateNoteRequest {
  title?: string;
  folderId?: string | null;
  content?: unknown;
  contentText?: string;
}
