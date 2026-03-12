import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseUser";
import admin from "firebase-admin";
import { sendEmail } from "@/lib/nodemailer";

if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!privateKey || !projectId || !clientEmail) {
    console.error("❌ Firebase Admin environmental variables are missing (send-notification)!");
  } else {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n").replace(/^["']|["']$/g, ""),
        }),
      });
      console.log("✅ Firebase Admin initialized (send-notification)");
    } catch (error) {
      console.error("❌ Firebase Admin initialization error (send-notification):", error);
    }
  }
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
    const { leaveDetails } = data;

    // 4. Send Email (If enabled in settings) - Non-blocking
    const shouldSendEmail = (isLeave && settings?.leave_email) || (isExemption && settings?.exemption_email);

    if (shouldSendEmail) {
      (async () => {
        try {
          const { data: adminEmployees } = await supabase
            .from("employees")
            .select("email")
            .eq("is_admin", true)
            .eq("is_active", true);

          const adminEmails = adminEmployees?.map(a => a.email).filter(Boolean) as string[];

          if (adminEmails?.length) {
            let htmlContent = `<div style="font-family: sans-serif; padding: 20px; color: #333; line-height: 1.5;">
                <h2 style="color: #2563eb; margin-bottom: 20px;">${title}</h2>
                <p style="font-size: 16px;">A new request has been submitted by <strong>${leaveDetails?.employeeName || "An employee"}</strong>.</p>
                
                <div style="background-color: #f8fafc; border-radius: 8px; padding: 15px; border: 1px solid #e2e8f0; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Request Details</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; width: 120px;"><strong>Dates:</strong></td>
                      <td style="padding: 8px 0; color: #1e293b;">${leaveDetails?.startDate || "N/A"} to ${leaveDetails?.endDate || "N/A"}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #64748b;"><strong>Duration:</strong></td>
                      <td style="padding: 8px 0; color: #1e293b;">${leaveDetails?.totalDays || "0"} day(s)</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #64748b;"><strong>Type:</strong></td>
                      <td style="padding: 8px 0; color: #1e293b; text-transform: capitalize;">${leaveDetails?.leaveType || "N/A"}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #64748b;"><strong>Status:</strong></td>
                      <td style="padding: 8px 0; color: #1e293b;">
                        <span style="background-color: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                          ${(leaveDetails?.status || "Pending").toUpperCase()}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; vertical-align: top;"><strong>Reason:</strong></td>
                      <td style="padding: 8px 0; color: #1e293b;">${leaveDetails?.reason || "No reason provided"}</td>
                    </tr>
                  </table>
                </div>

                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #666;">This is an automated notification from HRMS.</p>
              </div>`;

            await sendEmail({
              to: adminEmails.join(", "),
              subject: title,
              text: body,
              html: htmlContent
            });
          }
        } catch (e) {
          console.error("Admin Notification Email Failure:", e);
        }
      })();
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
      } else if (adminTokens && adminTokens.length > 0 && admin.apps.length) {
        const tokens = Array.from(new Set(adminTokens.map((t) => t.token)));
        admin.messaging().sendEachForMulticast({
          tokens: tokens,
          notification: { title, body },
        }).then(res => console.log("Push notifications sent (employee -> admin):", res.successCount))
          .catch(e => console.error("Push notification error:", e));
      }
    }

    return NextResponse.json(
      { message: "Notification processed" }
    );
  } catch (err: any) {
    console.error("Critical Admin Notification Error:", err);
    return NextResponse.json(
      { message: "Internal server error", error: err.message || err },
      { status: 500 }
    );
  }
}
