import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseUser";

export async function POST(req: NextRequest) {
  try {
    const { token, userId, platform, type } = await req.json();
    if (!token || !userId) {
      return NextResponse.json(
        { error: "Token or userId missing" },
        { status: 400 }
      );
    }
    // Check if token already exists
    const { data: existing, error: selectError } = await supabase
      .from("fcm_tokens")
      .select("*")
      .eq("token", token);
    if (selectError) {
      console.error("Supabase select error:", selectError.message);
      return NextResponse.json({ error: selectError.message }, { status: 500 });
    }
    // If token does not exist, insert it
    if (!existing || existing.length === 0) {
      const { data, error: insertError } = await supabase
        .from("fcm_tokens")
        .insert({ token, user_id: userId, platform: platform || "web", type });

      if (insertError) {
        console.error("Supabase insert error:", insertError.message);
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
