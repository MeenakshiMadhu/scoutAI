import { NextRequest, NextResponse } from "next/server";
import { PdfReader } from "pdfreader";
import { buildResumeProfile } from "@/lib/llmResume";

function extractPdfText(buf: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: string[] = [];
    new PdfReader().parseBuffer(buf, (err: any, item: any) => {
      if (err) return reject(err);
      if (!item) return resolve(chunks.join(" "));
      if (item.text) chunks.push(item.text);
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("resume") as File | null;
    if (!file)
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    if (file.type !== "application/pdf")
      return NextResponse.json(
        { error: "Please upload a PDF" },
        { status: 400 }
      );
    if (file.size > 5 * 1024 * 1024)
      return NextResponse.json(
        { error: "File too large (5MB max)" },
        { status: 400 }
      );

    const buf = Buffer.from(await file.arrayBuffer());
    const rawText = await extractPdfText(buf);
    if (!rawText.trim()) {
      return NextResponse.json(
        { error: "Couldn't read text from that PDF" },
        { status: 400 }
      );
    }

    const { profile, embedding, debug } = await buildResumeProfile(rawText);

    // Server terminal (npm run dev) — not visible in the browser
    console.log("RESUME PROFILE:", profile);
    console.log("RESUME DEBUG:", debug);

    return NextResponse.json({
      profile: {
        role_family: profile.role_family,
        seniority: profile.seniority,
        title: profile.title,
        skills: profile.skills,
        years_experience: profile.years_experience,
        summary: debug.summary,
      },
      embedding,
      debug,
    });
  } catch (e) {
    console.error("UPLOAD ERROR:", e);
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
