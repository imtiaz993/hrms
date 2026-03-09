import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseUser";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import admin from "firebase-admin";
import { sendEmail } from "@/lib/nodemailer";

const db = supabaseAdmin ?? supabase;

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
}

export async function POST(req: Request) {
  try {
    const { employeeId, title, body, adminNotification } = await req.json();

    if (!title) return NextResponse.json({ message: "Missing title" }, { status: 400 });
    if (!body) return NextResponse.json({ message: "Missing body" }, { status: 400 });
    if (!employeeId && !adminNotification) {
      return NextResponse.json({ message: "Missing recipient (employeeId or adminNotification)" }, { status: 400 });
    }

    const isClockAlert = title?.toLowerCase().includes("clock-in") || title?.toLowerCase().includes("clock-out");

    if (adminNotification) {
      // 1. Get all active admins
      const { data: admins, error: adminError } = await db
        .from("employees")
        .select("id, email")
        .eq("is_admin", true)
        .eq("is_active", true);

      if (adminError || !admins?.length) {
        return NextResponse.json(
          { message: "No admins found" },
          { status: 404 }
        );
      }

      const adminIds = admins.map((a) => a.id);
      const adminEmails = admins.map(a => a.email).filter(Boolean) as string[];

      // 2. Save notifications for all admins
      const notifications = adminIds.map((id) => ({
        employee_id: id,
        title,
        body,
        type: "admin",
      }));

      const { error: dbError } = await db.from("notifications").insert(notifications);
      if (dbError) throw dbError;

      // 3. Send Email
      if (!isClockAlert && adminEmails.length > 0) {
        try {
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
        } catch (emailErr) {
          console.error("Email send error for admins:", emailErr);
        }
      }

      // 4. Get FCM tokens for admins
      const { data: adminTokens } = await db
        .from("fcm_tokens")
        .select("token")
        .eq("type", "admin")
        .in("user_id", adminIds);

      if (adminTokens?.length) {
        const tokens = adminTokens.map((t) => t.token);
        await admin.messaging().sendEachForMulticast({
          tokens,
          notification: { title, body },
        });
      }

      return NextResponse.json({ message: "Notification sent to admins" }, { status: 200 });
    } else {
      // Flow for specific employee
      const { error: dbError } = await db.from("notifications").insert([
        {
          employee_id: employeeId,
          title,
          body,
          type: "employee",
        },
      ]);

      if (dbError) throw dbError;

      // 1. Send Email to Employee
      if (!isClockAlert) {
        try {
          const { data: emp } = await db
            .from("employees")
            .select("email")
            .eq("id", employeeId)
            .single();

          if (emp?.email) {
            await sendEmail({
              to: emp.email,
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
          console.error("Email send error for employee:", emailErr);
        }
      }

      // 2. Send Push
      const { data: employeeTokens } = await db
        .from("fcm_tokens")
        .select("token")
        .eq("type", "employee")
        .eq("user_id", employeeId);

      if (employeeTokens?.length) {
        const tokens = employeeTokens.map((t) => t.token);
        await admin.messaging().sendEachForMulticast({
          tokens,
          notification: { title, body },
        });
      }

      return NextResponse.json({ message: "Notification sent to employee" }, { status: 200 });
    }
  } catch (err: any) {
    console.error("Notification Error:", err);
    return NextResponse.json({ message: err.message || "Internal server error" }, { status: 500 });
  }
}
