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
    const bodyData = await req.json();
    const { employeeId, title, body, adminNotification, leaveDetails, exemptionDetails } = bodyData;

    if (!title) return NextResponse.json({ message: "Missing title" }, { status: 400 });
    if (!body) return NextResponse.json({ message: "Missing body" }, { status: 400 });
    if (!employeeId && !adminNotification) {
      return NextResponse.json({ message: "Missing recipient (employeeId or adminNotification)" }, { status: 400 });
    }

    const isClockAlert = title?.toLowerCase().includes("clock-in") || title?.toLowerCase().includes("clock-out");

    if (adminNotification) {
      // 1. Fetch Admin Settings
      const { data: settings } = await db
        .from("admin_settings")
        .select("*")
        .single();

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

      // 3. Determine Notification Type
      const titleLower = title.toLowerCase();
      const isLeave = titleLower.includes("leave");
      const isExemption = titleLower.includes("exemption");
      const isClock = titleLower.includes("clock-in") || titleLower.includes("clock-out");

      // 4. Send Email (If enabled in settings)
      const shouldSendEmail = (isLeave && settings?.leave_email) || (isExemption && settings?.exemption_email);

      if (shouldSendEmail && adminEmails.length > 0) {
        try {
          let htmlContent = "";

          if (isLeave && leaveDetails) {
            htmlContent = `<div style="font-family: sans-serif; padding: 20px; color: #333; line-height: 1.5;">
              <h2 style="color: #2563eb; margin-bottom: 20px;">${title}</h2>
              <p style="font-size: 16px;">A new request has been submitted by <strong>${leaveDetails.employeeName}</strong>.</p>
              
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 15px; border: 1px solid #e2e8f0; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Leave Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; width: 120px;"><strong>Dates:</strong></td>
                    <td style="padding: 8px 0; color: #1e293b;">${leaveDetails.startDate} to ${leaveDetails.endDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;"><strong>Duration:</strong></td>
                    <td style="padding: 8px 0; color: #1e293b;">${leaveDetails.totalDays} day(s)</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;"><strong>Type:</strong></td>
                    <td style="padding: 8px 0; color: #1e293b; text-transform: capitalize;">${leaveDetails.leaveType}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;"><strong>Status:</strong></td>
                    <td style="padding: 8px 0; color: #1e293b;">
                      <span style="background-color: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                        ${leaveDetails.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; vertical-align: top;"><strong>Reason:</strong></td>
                    <td style="padding: 8px 0; color: #1e293b;">${leaveDetails.reason}</td>
                  </tr>
                </table>
              </div>
              <p style="font-size: 12px; color: #666;">This is an automated notification from HRMS.</p>
            </div>`;
          } else if (isExemption && exemptionDetails) {
            htmlContent = `<div style="font-family: sans-serif; padding: 20px; color: #333; line-height: 1.5;">
              <h2 style="color: #2563eb; margin-bottom: 20px;">${title}</h2>
              <p style="font-size: 16px;">A new exemption request has been submitted by <strong>${exemptionDetails.employeeName}</strong>.</p>
              
              <div style="background-color: #fffaf0; border-radius: 8px; padding: 15px; border: 1px solid #feebc8; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #7b341e; border-bottom: 1px solid #feebc8; padding-bottom: 8px;">Exemption Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; width: 140px;"><strong>Date:</strong></td>
                    <td style="padding: 8px 0; color: #1e293b;">${exemptionDetails.date}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;"><strong>Requested In:</strong></td>
                    <td style="padding: 8px 0; color: #1e293b;">${exemptionDetails.requestedClockIn}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;"><strong>Requested Out:</strong></td>
                    <td style="padding: 8px 0; color: #1e293b;">${exemptionDetails.requestedClockOut}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; vertical-align: top;"><strong>Reason:</strong></td>
                    <td style="padding: 8px 0; color: #1e293b;">${exemptionDetails.reason}</td>
                  </tr>
                </table>
              </div>
              <p style="font-size: 12px; color: #666;">This is an automated notification from HRMS.</p>
            </div>`;
          } else {
            htmlContent = `<div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #2563eb;">${title}</h2>
              <p>${body}</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #666;">This is an automated notification from HRMS.</p>
            </div>`;
          }

          await sendEmail({
            to: adminEmails.join(", "),
            subject: title,
            text: body,
            html: htmlContent
          });
        } catch (emailErr) {
          console.error("Email send error for admins:", emailErr);
        }
      }

      // 5. Get FCM tokens for admins (If enabled in settings)
      const shouldSendPush =
        (isLeave && settings?.leave_notification) ||
        (isExemption && settings?.exemption_notification) ||
        (isClock && settings?.clock_in_notification);

      if (shouldSendPush) {
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
      }

      return NextResponse.json({ message: "Notification processed for admins" }, { status: 200 });
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
