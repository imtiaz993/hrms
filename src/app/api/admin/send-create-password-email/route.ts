import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email)
      return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/create-password`,
      },
    });

    if (error) return NextResponse.json({ error }, { status: 400 });

    const actionLink = data?.properties?.action_link;
    if (!actionLink)
      return NextResponse.json(
        { error: "No action link returned" },
        { status: 400 }
      );

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM, // e.g. "HRMS <no-reply@yourdomain.com>"
      to: email,
      subject: "Set your password",
      html: `
        <div style="font-family:system-ui;padding:16px">
          <p>Your HRMS account has been created.</p>
          <p>Email: <b>${email}</b></p>
          <p>Click below to create your password:</p>
          <p><a href="${actionLink}">Create Password</a></p>
          <p>If you did not request this, ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
