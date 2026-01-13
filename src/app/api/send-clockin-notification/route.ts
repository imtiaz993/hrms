import { NextResponse } from "next/server";
import { supabase } from "@/lib/Supabase";
import admin from "firebase-admin";

// Firebase Admin initialization

const privateKey = process.env.FIREBASE_PRIVATE_KEY;
if (!privateKey) throw new Error("FIREBASE_PRIVATE_KEY is missing in env");

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    privateKey: privateKey.replace(/\\n/g, "\n"),
  }),
});
console.log("✅ Firebase Admin initialized");

export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log("Received notification payload:", data);

    const { employeeId, employeeName, title, body } = data;

    if (!employeeId || !title || !body) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // const { data: adminTokens, error } = await supabase
    //   .from("fcm_tokens")
    //   .select("token")
    //   .eq("role", "admin");

    // console.log("Admin tokens fetched:", adminTokens, error);
    const adminTokens = [
      "cjzzcCnOWhGSsfBYnbj7f4:APA91bEz57KqiGvWv8lLAHOJCZ9l49jlBqskS_IbjkPAyO2xEcIXDU8prfsfmpftrQ3KBZb_q2qoaqzv6Wt0AS1WARpW8MprlH-8eX2J6NBGPwPSW_V6Y9Q",
    ];

    if (!adminTokens || adminTokens.length === 0) {
      return NextResponse.json(
        { message: "No admin tokens found" },
        { status: 400 }
      );
    }

    // if (error) throw error;
    // if (!adminTokens || adminTokens.length === 0)
    //   return NextResponse.json({ message: "No admin tokens found" }, { status: 400 });

    // 🔹 Prepare FCM message
    const messagePayload = {
      notification: { title, body },
      tokens: adminTokens.map((t: any) => t.token),
    };

    // 🔹 Send notification via Firebase Admin
    const response = await admin.messaging().sendEachForMulticast({
      tokens: adminTokens,
      notification: {
        title,
        body,
      },
    });

    console.log("✅ Notifications sent:", response.successCount);
    console.log("❌ Failed:", response.failureCount);

    return NextResponse.json(
      { message: "Notification sent", response },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Error sending notification:", err);
    return NextResponse.json(
      { message: "Internal server error", error: err },
      { status: 500 }
    );
  }
}
