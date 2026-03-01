import { NextRequest, NextResponse } from "next/server";
import { ConnectDB } from "@/lib/config/db";
import Task from "@/lib/models/Task";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const { dueDate, dueTime, userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!dueDate) {
      return NextResponse.json(
        { error: "Due date is required" },
        { status: 400 }
      );
    }

    if (dueTime && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(dueTime)) {
      return NextResponse.json(
        { error: "Invalid time format. Use HH:MM (24-hour)" },
        { status: 400 }
      );
    }

    await ConnectDB();

    const updateData: any = {
      dueDate: new Date(dueDate),
    };

    if (dueTime !== undefined) {
      updateData.dueTime = dueTime || null;
    }

    const task = await Task.findOneAndUpdate(
      { _id: taskId, createdBy: userId },
      updateData,
      { new: true }
    )
      .populate("linkedDeck", "title _id")
      .populate("linkedNote", "title _id");

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Reschedule task error:", error);
    return NextResponse.json(
      { error: "Failed to reschedule task" },
      { status: 500 }
    );
  }
}
