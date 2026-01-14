import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseUser";
import admin from "firebase-admin";

if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!privateKey) throw new Error("FIREBASE_PRIVATE_KEY is missing in env");

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    }),
  });
  console.log(" Firebase Admin initialized");
} else {
  admin.app();
}
export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log("Received notification payload:", data);

    const { employeeId, title, body } = data;

    if (!employeeId || !title || !body) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const { error: dbError } = await supabase.from("notifications").insert([
      {
        employee_id: employeeId,
        title,
        body,
        type: "admin",
      },
    ]);

    if (dbError) {
      console.error(" DB Error:", dbError);
      return NextResponse.json(
        { message: "Failed to save notification", error: dbError },
        { status: 500 }
      );
    }

    const { data: adminTokens, error } = await supabase
      .from("fcm_tokens")
      .select("*")
      .eq("type", "admin");

    if (error) {
      console.error("Error fetching tokens:", error);
      return NextResponse.json(
        { message: "Error fetching tokens" },
        { status: 400 }
      );
    }

    console.log("Notification saved to DB:", data);

    if (!adminTokens || adminTokens.length === 0) {
      return NextResponse.json(
        { message: "No admin tokens found" },
        { status: 400 }
      );
    }

    // 🔹 Send notification via Firebase Admin
    const response = await admin.messaging().sendEachForMulticast({
      tokens: adminTokens,
      notification: {
        title,
        body,
      },
    });

    console.log(" Notifications sent:", response.successCount);
    console.log(" Failed:", response.failureCount);

    return NextResponse.json(
      { message: "Notification sent", response },
      { status: 200 }
    );
  } catch (err) {
    console.error(" Error sending notification:", err);
    return NextResponse.json(
      { message: "Internal server error", error: err },
      { status: 500 }
    );
  }
}
