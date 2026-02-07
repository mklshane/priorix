import { NextRequest, NextResponse } from "next/server";
import { ConnectDB } from "@/lib/config/db";
import {
  calibrateUserProfile,
  applyCalibration,
  needsRecalibration,
} from "@/lib/profile-calibration";
import UserLearningProfile from "@/lib/models/UserLearningProfile";

// POST: Calibrate or recalibrate user profile
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    await ConnectDB();

    // Perform calibration
    const calibration = await calibrateUserProfile(userId);

    if (calibration.needsMoreData) {
      return NextResponse.json({
        success: true,
        needsMoreData: true,
        message: "Need at least 20 card reviews for calibration",
        currentCalibration: calibration,
      });
    }

    // Apply calibration
    await applyCalibration(userId, calibration);

    return NextResponse.json({
      success: true,
      calibration: {
        learningSpeed: calibration.learningSpeed,
        confidenceLevel: Math.round(calibration.confidenceLevel * 100),
        optimalSessionLength: calibration.optimalSessionLength,
        multipliers: calibration.recommendedMultipliers,
      },
    });
  } catch (error: any) {
    console.error("Error calibrating profile:", error);
    return NextResponse.json(
      { error: "Failed to calibrate profile", details: error.message },
      { status: 500 }
    );
  }
}

// GET: Check if calibration is needed
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    await ConnectDB();

    const needsCalibration = await needsRecalibration(userId);
    const profile = await UserLearningProfile.findOne({ userId });

    return NextResponse.json({
      needsCalibration,
      currentProfile: profile
        ? {
            learningSpeed: profile.learningSpeed,
            isCalibrated: profile.isCalibrated,
            calibrationReviews: profile.calibrationReviews,
            lastCalibrationDate: profile.lastCalibrationDate,
            optimalSessionLength: profile.optimalSessionLength,
          }
        : null,
    });
  } catch (error: any) {
    console.error("Error checking calibration:", error);
    return NextResponse.json(
      { error: "Failed to check calibration", details: error.message },
      { status: 500 }
    );
  }
}
