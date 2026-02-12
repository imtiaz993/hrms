import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseUser";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import admin from "firebase-admin";

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
    const { employeeId, title, body } = await req.json();

    if (!employeeId || !title || !body) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Save notification for EMPLOYEE
    const { error: dbError } = await db
      .from("notifications")
      .insert([
        {
          employee_id: employeeId, 
          title,
          body,
          type: "employee",
        },
      ]);

    if (dbError) {
      return NextResponse.json(
        { message: "Failed to save notification" },
        { status: 500 }
      );
    }

   
    const { data: employeeTokens, error } = await db
      .from("fcm_tokens")
      .select("token")
      .eq("type", "employee")
      .eq("user_id", employeeId); 

    if (error || !employeeTokens?.length) {
      return NextResponse.json(
        { message: "No employee tokens found" },
        { status: 400 }
      );
    }

    const tokens = employeeTokens.map(t => t.token);
    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title,
        body,
      },
    });

    return NextResponse.json(
      { message: "Notification sent to employee", response },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
