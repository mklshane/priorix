"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Folder } from "@/types/deck";

const fetchFolders = async (userId: string): Promise<Folder[]> => {
  const res = await fetch(`/api/folder?userId=${userId}&includeCounts=true`);
  if (!res.ok) {
    throw new Error("Failed to fetch folders");
  }
  return res.json();
};

const createFolderRequest = async (name: string, userId: string) => {
  const res = await fetch("/api/folder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, userId }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.error || "Failed to create folder");
  }
  return res.json();
};

const renameFolderRequest = async (
  folderId: string,
  name: string,
  userId: string
) => {
  const res = await fetch(`/api/folder/${folderId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, userId }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.error || "Failed to rename folder");
  }
  return res.json();
};

const deleteFolderRequest = async (folderId: string, userId: string) => {
  const res = await fetch(`/api/folder/${folderId}?userId=${userId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.error || "Failed to delete folder");
  }
  return res.json();
};

export const useFolders = (userId?: string) => {
  const queryClient = useQueryClient();

  const foldersQuery = useQuery<Folder[]>({
    queryKey: ["folders", userId],
    queryFn: () => fetchFolders(userId!),
    enabled: !!userId,
  });

  const createFolder = useMutation({
    mutationFn: (name: string) => createFolderRequest(name, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders", userId] });
    },
  });

  const renameFolder = useMutation({
    mutationFn: ({ folderId, name }: { folderId: string; name: string }) =>
      renameFolderRequest(folderId, name, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders", userId] });
    },
  });

  const deleteFolder = useMutation({
    mutationFn: (folderId: string) => deleteFolderRequest(folderId, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders", userId] });
      queryClient.invalidateQueries({ queryKey: ["decks", userId] });
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
