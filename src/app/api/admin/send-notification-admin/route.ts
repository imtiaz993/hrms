import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseUser";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import admin from "firebase-admin";
import { sendEmail } from "@/lib/nodemailer";

const db = supabaseAdmin ?? supabase;

if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!privateKey || !projectId || !clientEmail) {
    console.error("❌ Firebase Admin environmental variables are missing!");
  } else {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          // Handle both escaped newlines and potential quoting from some env managers
          privateKey: privateKey.replace(/\\n/g, "\n").replace(/^["']|["']$/g, ""),
        }),
      });
      console.log("✅ Firebase Admin initialized successfully");
    } catch (error) {
      console.error("❌ Firebase Admin initialization error:", error);
    }
  }
}

export async function POST(req: Request) {
  try {
    const bodyData = await req.json();
    const {
      employeeId,
      title,
      body,
      adminNotification,
      broadcast,
      leaveDetails,
      exemptionDetails,
      attendanceDetails,
      holidayDetails,
      policyDetails
    } = bodyData;

    if (!title) return NextResponse.json({ message: "Missing title" }, { status: 400 });
    if (!body) return NextResponse.json({ message: "Missing body" }, { status: 400 });

    if (!employeeId && !adminNotification && !broadcast) {
      return NextResponse.json({ message: "Missing recipient" }, { status: 400 });
    }

    const titleLower = title.toLowerCase();
    const isLeave = titleLower.includes("leave");
    const isExemption = titleLower.includes("exemption");
    const isClock = titleLower.includes("clock-in") || titleLower.includes("clock-out") || titleLower.includes("attendance");
    const isHoliday = titleLower.includes("holiday");
    const isPolicy = titleLower.includes("policy");

    if (!supabaseAdmin) {
      console.warn("⚠️ SUPABASE_SERVICE_ROLE_KEY is missing. RLS might block database operations.");
    }

    // --- BROADCAST FLOW (To all active employees) ---
    if (broadcast) {
      const { data: emps, error: empError } = await db
        .from("employees")
        .select("id, email")
        .eq("is_active", true);

      if (empError || !emps?.length) {
        console.error("Broadcast error: No active employees found", empError);
        throw new Error("No active employees found for broadcast");
      }

      const recipientIds = emps.map(e => e.id);
      const recipientEmails = emps.map(e => e.email).filter(Boolean) as string[];

      // 1. Save Notifications
      const notifications = recipientIds.map(id => ({
        employee_id: id,
        title,
        body,
        type: "employee"
      }));
      await db.from("notifications").insert(notifications);

      // 2. Prepare Email Content
      let htmlContent = "";
      if (isHoliday && holidayDetails) {
        htmlContent = `<div style="font-family: sans-serif; padding: 20px; color: #333; line-height: 1.5;">
          <h2 style="color: #2563eb; margin-bottom: 20px;">🎉 New Holiday Announced: ${holidayDetails.name}</h2>
          <div style="background-color: #f0f9ff; border-radius: 8px; padding: 20px; border: 1px solid #bae6fd;">
            <p style="font-size: 18px; margin: 0;"><strong>Date:</strong> ${holidayDetails.date}</p>
            <p style="font-size: 16px; margin-top: 10px;">Enjoy your day off!</p>
          </div>
          <p style="font-size: 12px; color: #666; margin-top: 20px;">This is an automated notification from HRMS.</p>
        </div>`;
      } else if (isPolicy) {
        htmlContent = `<div style="font-family: sans-serif; padding: 20px; color: #333; line-height: 1.5;">
          <h2 style="color: #2563eb; margin-bottom: 20px;">📢 Company Policy Update</h2>
          <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; border: 1px solid #e2e8f0;">
            <p style="font-size: 16px; margin: 0;">The company policy has been updated. Please log in to the HRMS portal to review the latest changes.</p>
            <p style="font-size: 14px; margin-top: 15px; color: #64748b;">No PDF attached. Check HRMS for full details.</p>
          </div>
          <p style="font-size: 12px; color: #666; margin-top: 20px;">This is an automated notification from HRMS.</p>
        </div>`;
      } else {
        htmlContent = `<div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #2563eb;">${title}</h2>
          <p>${body}</p>
        </div>`;
      }

      // 3. Send Emails (Non-blocking)
      if (recipientEmails.length > 0) {
        sendEmail({
          to: recipientEmails.join(", "),
          subject: title,
          text: body,
          html: htmlContent
        }).catch(err => console.error("Email Broadcast Error:", err));
      }

      // 4. Send Push
      const { data: tokens } = await db.from("fcm_tokens").select("token").in("user_id", recipientIds);
      if (tokens?.length && admin.apps.length) {
        const uniqueTokens = Array.from(new Set(tokens.map(t => t.token)));
        admin.messaging().sendEachForMulticast({
          tokens: uniqueTokens,
          notification: { title, body }
        }).then(res => console.log("Push Broadcast Sent:", res.successCount))
          .catch(err => console.error("Push Broadcast Error:", err));
      }

      return NextResponse.json({ message: "Broadcast handled" });
    }

    // --- ADMIN NOTIFICATION FLOW ---
    if (adminNotification) {
      const { data: settings } = await db.from("admin_settings").select("*").single();
      const { data: admins } = await db.from("employees").select("id, email").eq("is_admin", true).eq("is_active", true);

      if (!admins?.length) return NextResponse.json({ message: "No admins found" }, { status: 404 });

      const adminIds = admins.map(a => a.id);
      const adminEmails = admins.map(a => a.email).filter(Boolean) as string[];

      // Save Notifications
      await db.from("notifications").insert(adminIds.map(id => ({ employee_id: id, title, body, type: "admin" })));

      // Email Logic (Non-blocking)
      if ((isLeave && settings?.leave_email) || (isExemption && settings?.exemption_email)) {
        let htmlContent = "";
        if (isLeave && leaveDetails) {
          htmlContent = `<div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2563eb;">Leave Request: ${leaveDetails.employeeName}</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Dates</strong></td><td style="padding: 8px; border: 1px solid #eee;">${leaveDetails.startDate} to ${leaveDetails.endDate}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Days</strong></td><td style="padding: 8px; border: 1px solid #eee;">${leaveDetails.totalDays}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Type</strong></td><td style="padding: 8px; border: 1px solid #eee;">${leaveDetails.leaveType}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Reason</strong></td><td style="padding: 8px; border: 1px solid #eee;">${leaveDetails.reason}</td></tr>
            </table>
          </div>`;
        } else if (isExemption && exemptionDetails) {
          htmlContent = `<div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2563eb;">Exemption Request: ${exemptionDetails.employeeName}</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Date</strong></td><td style="padding: 8px; border: 1px solid #eee;">${exemptionDetails.date}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Clock In</strong></td><td style="padding: 8px; border: 1px solid #eee;">${exemptionDetails.requestedClockIn}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Clock Out</strong></td><td style="padding: 8px; border: 1px solid #eee;">${exemptionDetails.requestedClockOut}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Reason</strong></td><td style="padding: 8px; border: 1px solid #eee;">${exemptionDetails.reason}</td></tr>
            </table>
          </div>`;
        } else {
          htmlContent = `<div style="font-family: sans-serif; padding: 20px; color: #333;"><h2>${title}</h2><p>${body}</p></div>`;
        }

        if (adminEmails.length > 0) {
          sendEmail({ to: adminEmails.join(", "), subject: title, text: body, html: htmlContent })
            .catch(err => console.error("Admin Email Error:", err));
        }
      }

      // Push Logic
      if ((isLeave && settings?.leave_notification) || (isExemption && settings?.exemption_notification) || (isClock && settings?.clock_in_notification)) {
        const { data: tokens } = await db.from("fcm_tokens").select("token").in("user_id", adminIds);
        if (tokens?.length && admin.apps.length) {
          const uniqueTokens = Array.from(new Set(tokens.map(t => t.token)));
          admin.messaging().sendEachForMulticast({ tokens: uniqueTokens, notification: { title, body } })
            .then(res => console.log("Admin Push Sent:", res.successCount))
            .catch(err => console.error("Admin Push Error:", err));
        }
      }

      return NextResponse.json({ message: "Admin notifications handled" });
    }

    // --- TARGETED EMPLOYEE NOTIFICATION FLOW ---
    if (employeeId) {
      // Save Notification
      await db.from("notifications").insert([{ employee_id: employeeId, title, body, type: "employee" }]);

      // Email Logic (Non-blocking)
      const { data: emp } = await db.from("employees").select("email").eq("id", employeeId).single();
      if (emp?.email) {
        let htmlContent = "";
        if (isLeave && leaveDetails) {
          htmlContent = `<div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2563eb;">Leave Status: ${title}</h2>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <p>Your leave request from <strong>${leaveDetails.startDate}</strong> to <strong>${leaveDetails.endDate}</strong> has been updated.</p>
              <p><strong>Status:</strong> <span style="text-transform: uppercase; font-weight: bold; color: ${titleLower.includes("approved") ? "#16a34a" : "#dc2626"};">${leaveDetails.status}</span></p>
              ${leaveDetails.reason ? `<p><strong>Reason:</strong> ${leaveDetails.reason}</p>` : ""}
            </div>
            <p style="margin-top: 20px; font-size: 12px; color: #666;">View details on your dashboard.</p>
          </div>`;
        } else if (isExemption && exemptionDetails) {
          htmlContent = `<div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2563eb;">Exemption Status: ${title}</h2>
            <div style="background-color: #F3F7FA; padding: 15px; border-radius: 8px; border: 1px solid #feebc8;">
              <p>Your exemption request for <strong>${exemptionDetails.date}</strong> has been updated.</p>
              <p><strong>Status:</strong> <span style="text-transform: uppercase; font-weight: bold; color: ${titleLower.includes("approved") ? "#16a34a" : "#dc2626"};">${exemptionDetails.status}</span></p>
              <p><strong>Corrected Times:</strong> ${exemptionDetails.requestedClockIn} - ${exemptionDetails.requestedClockOut}</p>
            </div>
          </div>`;
        } else if (isClock && attendanceDetails) {
          htmlContent = `<div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2563eb;">Attendance Record Adjusted</h2>
            <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px;">
              <p>Admin has adjusted your attendance entry for <strong>${attendanceDetails.date}</strong>.</p>
              <table style="width: 100%; margin-top: 10px;">
                <tr><td><strong>Clock In:</strong></td><td>${attendanceDetails.clockIn || "N/A"}</td></tr>
                <tr><td><strong>Clock Out:</strong></td><td>${attendanceDetails.clockOut || "N/A"}</td></tr>
                <tr><td><strong>Total Hours:</strong></td><td>${attendanceDetails.totalHours?.toFixed(2) || "0.00"}</td></tr>
              </table>
            </div>
          </div>`;
        } else {
          htmlContent = `<div style="font-family: sans-serif; padding: 20px; color: #333;"><h2>${title}</h2><p>${body}</p></div>`;
        }

        sendEmail({ to: emp.email, subject: title, text: body, html: htmlContent })
          .catch(err => console.error("Employee Email Error:", err));
      }

      // Push Logic
      const { data: tokens } = await db.from("fcm_tokens").select("token").eq("user_id", employeeId);
      if (tokens?.length && admin.apps.length) {
        const uniqueTokens = Array.from(new Set(tokens.map(t => t.token)));
        admin.messaging().sendEachForMulticast({ tokens: uniqueTokens, notification: { title, body } })
          .then(res => console.log("Employee Push Sent:", res.successCount))
          .catch(err => console.error("Employee Push Error:", err));
      }

      return NextResponse.json({ message: "Notification sent to employee" });
    }

    return NextResponse.json({ message: "Request handled" });

  } catch (err: any) {
    console.error("Critical Notification Error:", err);
    return NextResponse.json({ message: err.message || "Internal server error" }, { status: 500 });
  }
}
