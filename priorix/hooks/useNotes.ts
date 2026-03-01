"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreateNoteRequest, Note, UpdateNoteRequest } from "@/types/note";

const buildNotesUrl = (params: {
  folderId?: string | null;
  search?: string;
  sortBy?: "name" | "date" | "recent";
}) => {
  const query = new URLSearchParams();

  if (params.folderId === null) {
    query.set("folderId", "null");
  } else if (params.folderId) {
    query.set("folderId", params.folderId);
  }

  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }

  if (params.sortBy) {
    query.set("sortBy", params.sortBy);
  }

  const serialized = query.toString();
  return serialized ? `/api/notes?${serialized}` : "/api/notes";
};

const fetchNotes = async (params: {
  folderId?: string | null;
  search?: string;
  sortBy?: "name" | "date" | "recent";
}): Promise<Note[]> => {
  const response = await fetch(buildNotesUrl(params));

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || "Failed to fetch notes");
  }

  return response.json();
};

const fetchNote = async (noteId: string): Promise<Note> => {
  const response = await fetch(`/api/notes/${noteId}`);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || "Failed to fetch note");
  }

  return response.json();
};

const createNoteRequest = async (payload: CreateNoteRequest): Promise<Note> => {
  const response = await fetch("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || "Failed to create note");
  }

  return response.json();
};

const updateNoteRequest = async (
  noteId: string,
  payload: UpdateNoteRequest
): Promise<Note> => {
  const response = await fetch(`/api/notes/${noteId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || "Failed to update note");
  }

  return response.json();
};

const deleteNoteRequest = async (noteId: string) => {
  const response = await fetch(`/api/notes/${noteId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || "Failed to delete note");
  }

  return response.json();
};

export const useNotes = (
  enabled: boolean,
  params: {
    folderId?: string | null;
    search?: string;
    sortBy?: "name" | "date" | "recent";
  }
) => {
  return useQuery<Note[]>({
    queryKey: ["notes", params.folderId ?? "root", params.search ?? "", params.sortBy ?? "date"],
    queryFn: () => fetchNotes(params),
    enabled,
  });
};

export const useNote = (enabled: boolean, noteId?: string) => {
  return useQuery<Note>({
    queryKey: ["note", noteId],
    queryFn: () => fetchNote(noteId!),
    enabled: enabled && !!noteId,
  });
};

export const useNoteMutations = () => {
  const queryClient = useQueryClient();

  const createNote = useMutation({
    mutationFn: (payload: CreateNoteRequest) => createNoteRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["note-folders"] });
    },
  });

  const updateNote = useMutation({
    mutationFn: ({
      noteId,
      payload,
    }: {
      noteId: string;
      payload: UpdateNoteRequest;
      skipInvalidate?: boolean;
    }) =>
      updateNoteRequest(noteId, payload),
    onSuccess: (updated, vars) => {
      queryClient.setQueryData(["note", vars.noteId], updated);
      if (!vars.skipInvalidate) {
        queryClient.invalidateQueries({ queryKey: ["notes"] });
        queryClient.invalidateQueries({ queryKey: ["note-folders"] });
      }
    },
  });

  const deleteNote = useMutation({
    mutationFn: (noteId: string) => deleteNoteRequest(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["note-folders"] });
    },
  });

  return {
    createNote,
    updateNote,
    deleteNote,
  };
};
