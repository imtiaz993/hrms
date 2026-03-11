import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseUser";
import admin from "firebase-admin";
import { sendEmail } from "@/lib/nodemailer";

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

    // 1. Fetch Admin Settings
    const { data: settings } = await supabase
      .from("admin_settings")
      .select("*")
      .single();

    // 2. Save to DB (Always save notification for history)
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

    // 3. Determine Notification Type
    const titleLower = title.toLowerCase();
    const isLeave = titleLower.includes("leave");
    const isExemption = titleLower.includes("exemption");
    const isClock = titleLower.includes("clock-in") || titleLower.includes("clock-out");

    // 4. Send Email (If enabled in settings)
    const shouldSendEmail = (isLeave && settings?.leave_email) || (isExemption && settings?.exemption_email);

    if (shouldSendEmail) {
      try {
        const { data: adminEmployees } = await supabase
          .from("employees")
          .select("email")
          .eq("is_admin", true)
          .eq("is_active", true);

        const adminEmails = adminEmployees?.map(a => a.email).filter(Boolean) as string[];

        if (adminEmails?.length) {
          await sendEmail({
            to: adminEmails.join(", "),
            subject: title,
            text: body,
            html: `<div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #2563eb;">${title}</h2>
              <p>${body}</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #666;">This is an automated notification from HRMS.</p>
            </div>`
          });
        }
      } catch (emailErr) {
        console.error("Failed to send admin notification emails:", emailErr);
      }
    }

    // 5. Send FCM (Push) (If enabled in settings)
    const shouldSendPush =
      (isLeave && settings?.leave_notification) ||
      (isExemption && settings?.exemption_notification) ||
      (isClock && settings?.clock_in_notification);

    if (shouldSendPush) {
      const { data: adminTokens, error } = await supabase
        .from("fcm_tokens")
        .select("*")
        .eq("type", "admin");

      if (error) {
        console.error("Error fetching tokens:", error);
      } else if (adminTokens && adminTokens.length > 0) {
        const tokens = adminTokens.map((t) => t.token);
        await admin.messaging().sendEachForMulticast({
          tokens: tokens,
          notification: { title, body },
        });
        console.log(" Push Notifications sent");
      }
    }

    return NextResponse.json(
      { message: "Notification processed" },
      { status: 200 }
    );
  } catch (err: any) {
    console.error(" Error sending notification:", err);
    return NextResponse.json(
      { message: "Internal server error", error: err },
      { status: 500 }
    );
  }
}
