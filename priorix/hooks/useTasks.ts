"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryKey,
} from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/useToast";
import type {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskStatus,
} from "@/types/task";

const TASKS_KEY = "tasks";

async function fetchTasks(params: Record<string, string>): Promise<Task[]> {
  const searchParams = new URLSearchParams(params);
  const res = await fetch(`/api/tasks?${searchParams.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch tasks");
  }
  return res.json();
}

export function useTasksForDateRange(
  startDate: string,
  endDate: string,
  status?: string
) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  return useQuery<Task[]>({
    queryKey: [TASKS_KEY, "range", userId, startDate, endDate, status],
    queryFn: () => {
      const params: Record<string, string> = {
        userId: userId!,
        startDate,
        endDate,
      };
      if (status) params.status = status;
      return fetchTasks(params);
    },
    enabled: !!userId && !!startDate && !!endDate,
    staleTime: 30_000,
  });
}

export function useTasksForDate(date: string, status?: string) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  return useQuery<Task[]>({
    queryKey: [TASKS_KEY, "date", userId, date, status],
    queryFn: () => {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const params: Record<string, string> = {
        userId: userId!,
        startDate: dayStart.toISOString(),
        endDate: dayEnd.toISOString(),
      };
      if (status) params.status = status;
      return fetchTasks(params);
    },
    enabled: !!userId && !!date,
    staleTime: 30_000,
  });
}

export function useAllTasks(status?: string) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  return useQuery<Task[]>({
    queryKey: [TASKS_KEY, "all", userId, status],
    queryFn: () => {
      const params: Record<string, string> = { userId: userId! };
      if (status) params.status = status;
      return fetchTasks(params);
    },
    enabled: !!userId,
    staleTime: 30_000,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateTaskRequest): Promise<Task> => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create task");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY] });
      showToast("Task created successfully", "success");
    },
    onError: (error: Error) => {
      showToast(error.message || "Failed to create task", "error");
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async ({
      taskId,
      data,
    }: {
      taskId: string;
      data: UpdateTaskRequest;
    }): Promise<Task> => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update task");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY] });
      showToast("Task updated", "success");
    },
    onError: (error: Error) => {
      showToast(error.message || "Failed to update task", "error");
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (taskId: string): Promise<void> => {
      const userId = session?.user?.id;
      const res = await fetch(`/api/tasks/${taskId}?userId=${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete task");
      }
    },
    onMutate: async (taskId: string) => {
      await queryClient.cancelQueries({ queryKey: [TASKS_KEY] });

      const queryCache = queryClient.getQueryCache();
      const taskQueries = queryCache.findAll({ queryKey: [TASKS_KEY] });

      const previousData: { queryKey: QueryKey; data: unknown }[] = [];
      taskQueries.forEach((query) => {
        const data = query.state.data;
        if (Array.isArray(data)) {
          previousData.push({ queryKey: query.queryKey, data });
          queryClient.setQueryData(
            query.queryKey,
            (data as Task[]).filter((t) => t._id !== taskId)
          );
        }
      });

      return { previousData };
    },
    onError: (_error, _taskId, context) => {
      context?.previousData?.forEach(({ queryKey, data }) => {
        queryClient.setQueryData(queryKey, data);
      });
      showToast("Failed to delete task", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY] });
    },
    onSuccess: () => {
      showToast("Task deleted", "success");
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (taskId: string): Promise<Task> => {
      const userId = session?.user?.id;
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed", userId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to complete task");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY] });
      showToast("Task completed!", "success");
    },
    onError: (error: Error) => {
      showToast(error.message || "Failed to complete task", "error");
    },
  });
}

export function useRestoreTask() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (taskId: string): Promise<Task> => {
      const userId = session?.user?.id;
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "todo", userId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to restore task");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY] });
      showToast("Task restored", "success");
    },
    onError: (error: Error) => {
      showToast(error.message || "Failed to restore task", "error");
    },
  });
}

export function useRescheduleTask() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async ({
      taskId,
      dueDate,
      dueTime,
    }: {
      taskId: string;
      dueDate: string;
      dueTime?: string;
    }): Promise<Task> => {
      const userId = session?.user?.id;
      const res = await fetch(`/api/tasks/${taskId}/reschedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate, dueTime, userId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to reschedule task");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY] });
      showToast("Task rescheduled", "success");
    },
    onError: (error: Error) => {
      showToast(error.message || "Failed to reschedule task", "error");
    },
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async ({
      taskId,
      status,
    }: {
      taskId: string;
      status: TaskStatus;
    }): Promise<Task> => {
      const userId = session?.user?.id;
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, userId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update task status");
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY] });
      showToast(`Task marked as ${variables.status}`, "success");
    },
    onError: (error: Error) => {
      showToast(error.message || "Failed to update status", "error");
    },
  });
}
