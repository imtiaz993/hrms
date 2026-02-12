import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseUser";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { token, userId, platform, type } = await req.json();
    if (!token || !userId) {
      return NextResponse.json(
        { error: "Token or userId missing" },
        { status: 400 }
      );
    }
    const client = supabaseAdmin ?? supabase;
    const payload = {
      token,
      user_id: userId,
      platform: platform || "web",
      type: type || "employee",
    };

    const { data: existing, error: selectError } = await client
      .from("fcm_tokens")
      .select("id, user_id, type")
      .eq("token", token)
      .maybeSingle();

    if (selectError) {
      console.error("Supabase select error:", selectError.message);
      return NextResponse.json({ error: selectError.message }, { status: 500 });
    }

    if (existing) {
      const { error: updateError } = await client
        .from("fcm_tokens")
        .update({ user_id: userId, type: payload.type, platform: payload.platform })
        .eq("token", token);

      if (updateError) {
        console.error("Supabase update error:", updateError.message);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    } else {
      const { error: insertError } = await client
        .from("fcm_tokens")
        .insert(payload);

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
