export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "todo" | "in-progress" | "completed";

export interface RecurringConfig {
  frequency: "daily" | "weekly" | "monthly" | "custom";
  interval?: number;
  endDate?: string;
}

export interface LinkedEntity {
  _id: string;
  title: string;
}

export interface Task {
  _id: string;
  taskTitle: string;
  description?: string;
  status: TaskStatus;
  dueDate?: string;
  dueTime?: string;
  priority: TaskPriority;
  tags: string[];
  color?: string;
  linkedDeck?: string | LinkedEntity | null;
  linkedNote?: string | LinkedEntity | null;
  recurring?: RecurringConfig | null;
  createdBy: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  taskTitle: string;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  priority?: TaskPriority;
  tags?: string[];
  color?: string;
  linkedDeck?: string;
  linkedNote?: string;
  recurring?: RecurringConfig;
  userId: string;
}

export interface UpdateTaskRequest {
  taskTitle?: string;
  description?: string;
  status?: TaskStatus;
  dueDate?: string;
  dueTime?: string;
  priority?: TaskPriority;
  tags?: string[];
  color?: string;
  linkedDeck?: string | null;
  linkedNote?: string | null;
  recurring?: RecurringConfig | null;
  userId: string;
}

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  urgent: "var(--destructive)",
  high: "var(--warning)",
  medium: "var(--primary)",
  low: "var(--muted-foreground)",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const TASK_COLORS = [
  { name: "Green", value: "var(--green)" },
  { name: "Violet", value: "var(--violet)" },
  { name: "Purple", value: "var(--purple)" },
  { name: "Perry", value: "var(--perry)" },
  { name: "Pink", value: "var(--pink)" },
  { name: "Blue", value: "var(--blue)" },
] as const;
