"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { NoteFolder } from "@/types/note";

const fetchNoteFolders = async (): Promise<NoteFolder[]> => {
  const response = await fetch("/api/note-folder?includeCounts=true");
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || "Failed to fetch note folders");
  }
  return response.json();
};

const createNoteFolderRequest = async (name: string) => {
  const response = await fetch("/api/note-folder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || "Failed to create note folder");
  }

  return response.json();
};

const updateNoteFolderRequest = async (folderId: string, name: string) => {
  const response = await fetch(`/api/note-folder/${folderId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || "Failed to update note folder");
  }

  return response.json();
};

const deleteNoteFolderRequest = async (folderId: string) => {
  const response = await fetch(`/api/note-folder/${folderId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || "Failed to delete note folder");
  }

  return response.json();
};

export const useNoteFolders = (enabled: boolean) => {
  const queryClient = useQueryClient();

  const foldersQuery = useQuery<NoteFolder[]>({
    queryKey: ["note-folders"],
    queryFn: fetchNoteFolders,
    enabled,
  });

  const createFolder = useMutation({
    mutationFn: (name: string) => createNoteFolderRequest(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["note-folders"] });
    },
  });

  const renameFolder = useMutation({
    mutationFn: ({ folderId, name }: { folderId: string; name: string }) =>
      updateNoteFolderRequest(folderId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["note-folders"] });
    },
  });

  const deleteFolder = useMutation({
    mutationFn: (folderId: string) => deleteNoteFolderRequest(folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["note-folders"] });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  return {
    folders: foldersQuery.data || [],
    isLoading: foldersQuery.isLoading,
    isFetching: foldersQuery.isFetching,
    error: foldersQuery.error,
    createFolder,
    renameFolder,
    deleteFolder,
  };
};
