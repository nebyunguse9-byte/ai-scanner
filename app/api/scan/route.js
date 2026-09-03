import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { image, userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: "Supabase environment variables missing." }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: profile, error: fetchErr } = await supabase
      .from("profiles")
      .select("scans_left")
      .eq("id", userId)
      .single();

    if (fetchErr || !profile) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }

    if (profile.scans_left <= 0) {
      return NextResponse.json({ 
        error: "You have finished your testing quota. Thank you!" 
      }, { status: 403 });
    }

    const base64Data = image.split(",")[1];
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent([
      "Analyze this image and return JSON: { \"title\": string, \"summary\": string, \"facts\": string[] }",
      { inlineData: { mimeType: "image/jpeg", data: base64Data } }
    ]);

    const responseText = result.response.text().replace(/```json|```/g, "").trim();
    const parsedData = JSON.parse(responseText);

    await supabase
      .from("profiles")
      .update({ scans_left: profile.scans_left - 1 })
      .eq("id", userId);

    return NextResponse.json({ ...parsedData, scans_left: profile.scans_left - 1 });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
