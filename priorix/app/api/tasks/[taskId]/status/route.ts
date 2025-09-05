// app/api/tasks/[taskId]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ConnectDB } from "@/lib/config/db";
import Task from "@/lib/models/Task";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const { status, userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!["todo", "in-progress", "completed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await ConnectDB();

    // If marking as completed, delete the task from database
    if (status === "completed") {
      const task = await Task.findOneAndDelete({
        _id: taskId,
        createdBy: userId,
      });

      if (!task) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }

      // Return the deleted task data for frontend confirmation
      return NextResponse.json({
        ...task.toObject(),
        status: "completed",
        completedAt: new Date(),
        message: "Task completed and removed",
      });
    }

    // For other status updates (todo, in-progress), update normally
    const updateData: any = { status };

    if (status === "todo" || status === "in-progress") {
      updateData.completedAt = null;
    }

    const task = await Task.findOneAndUpdate(
      { _id: taskId, createdBy: userId },
      updateData,
      { new: true }
    );

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Update task status error:", error);
    return NextResponse.json(
      { error: "Failed to update task status" },
      { status: 500 }
    );
  }
}
