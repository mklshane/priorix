import { NextRequest, NextResponse } from "next/server";
import { ConnectDB } from "@/lib/config/db";
import Task from "@/lib/models/Task";
import "@/lib/models/Note";
import "@/lib/models/Deck";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const tag = searchParams.get("tag");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const priority = searchParams.get("priority");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    await ConnectDB();

    const query: any = { createdBy: userId };

    if (status && status !== "all") {
      query.status = status;
    }

    if (tag) {
      query.tags = tag.toLowerCase();
    }

    if (priority && ["low", "medium", "high", "urgent"].includes(priority)) {
      query.priority = priority;
    }

    if (startDate || endDate) {
      query.dueDate = {};
      if (startDate) query.dueDate.$gte = new Date(startDate);
      if (endDate) query.dueDate.$lte = new Date(endDate);
    }

    const tasks = await Task.find(query)
      .populate("linkedDeck", "title _id")
      .populate("linkedNote", "title _id")
      .sort({ dueDate: 1, priority: -1, createdAt: -1 })
      .lean();

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
    const {
      taskTitle,
      description,
      dueDate,
      dueTime,
      priority,
      tags,
      color,
      linkedDeck,
      linkedNote,
      recurring,
      userId,
    } = body;

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

    if (priority && !["low", "medium", "high", "urgent"].includes(priority)) {
      return NextResponse.json(
        { error: "Invalid priority value" },
        { status: 400 }
      );
    }

    if (
      dueTime &&
      !/^([01]\d|2[0-3]):([0-5]\d)$/.test(dueTime)
    ) {
      return NextResponse.json(
        { error: "Invalid time format. Use HH:MM (24-hour)" },
        { status: 400 }
      );
    }

    await ConnectDB();

    const task = await Task.create({
      taskTitle: taskTitle.trim(),
      description: description?.trim(),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      dueTime: dueTime || undefined,
      priority: priority || "medium",
      tags: tags?.map((tag: string) => tag.toLowerCase().trim()) || [],
      color: color || undefined,
      linkedDeck: linkedDeck || undefined,
      linkedNote: linkedNote || undefined,
      recurring: recurring || undefined,
      createdBy: userId,
    });

    const populatedTask = await Task.findById(task._id)
      .populate("linkedDeck", "title _id")
      .populate("linkedNote", "title _id");

    return NextResponse.json(populatedTask, { status: 201 });
  } catch (error) {
    console.error("Create task error:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
