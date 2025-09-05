// app/api/tasks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ConnectDB } from "@/lib/config/db";
import Task from "@/lib/models/Task";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const tag = searchParams.get("tag");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    await ConnectDB();

    // Build query
    const query: any = { createdBy: userId };

    if (status && status !== "all") {
      query.status = status;
    }

    if (tag) {
      query.tags = tag.toLowerCase();
    }

    const tasks = await Task.find(query).sort({ dueDate: 1, createdAt: -1 });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Get tasks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskTitle, description, dueDate, tags, userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!taskTitle?.trim()) {
      return NextResponse.json(
        { error: "Task title is required" },
        { status: 400 }
      );
    }

    await ConnectDB();

    const task = await Task.create({
      taskTitle: taskTitle.trim(),
      description: description?.trim(),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      tags: tags?.map((tag: string) => tag.toLowerCase().trim()) || [],
      createdBy: userId,
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Create task error:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
