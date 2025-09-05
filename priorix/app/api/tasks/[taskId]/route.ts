import { NextRequest, NextResponse } from "next/server";
import { ConnectDB } from "@/lib/config/db";
import Task from "@/lib/models/Task";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const { taskId } = await params;
    await ConnectDB();

    const task = await Task.findOne({ _id: taskId, createdBy: userId });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Get task error:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const body = await request.json();
    const { taskTitle, description, status, dueDate, tags, userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    await ConnectDB();

    const updateData: any = {};

    if (taskTitle !== undefined) {
      if (!taskTitle.trim()) {
        return NextResponse.json(
          { error: "Task title cannot be empty" },
          { status: 400 }
        );
      }
      updateData.taskTitle = taskTitle.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim();
    }

    if (status !== undefined) {
      if (!["todo", "in-progress", "completed"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updateData.status = status;

      // Set completedAt if marking as completed
      if (status === "completed") {
        updateData.completedAt = new Date();
      } else if (status !== "completed") {
        updateData.completedAt = null;
      }
    }

    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }

    if (tags !== undefined) {
      updateData.tags =
        tags?.map((tag: string) => tag.toLowerCase().trim()) || [];
    }

    const task = await Task.findOneAndUpdate(
      { _id: taskId, createdBy: userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Update task error:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const { taskId } = await params;
    await ConnectDB();

    const task = await Task.findOneAndDelete({
      _id: taskId,
      createdBy: userId,
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete task error:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
