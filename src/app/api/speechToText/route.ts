import { OpenAI } from "openai";
import { NextResponse, NextRequest } from "next/server";
import fs from "fs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  ...(process.env.OPENAI_BASE_URL && { baseURL: process.env.OPENAI_BASE_URL }),
});

export const runtime = "edge";

interface RequestBody {
  audio: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured for speech recognition" },
        { status: 500 }
      );
    }

    const req = await request.json();
    const base64Audio = req.audio;
    
    if (!base64Audio) {
      return NextResponse.json(
        { error: "No audio data provided" },
        { status: 400 }
      );
    }

    const audio = Buffer.from(base64Audio, "base64");
    const text = await convertAudioToText(audio);

    return NextResponse.json({ result: text }, { status: 200 });
  } catch (error) {
    return handleErrorResponse(error);
  }
}

async function convertAudioToText(audioData: Buffer) {
  const outputPath = "/tmp/input.webm";
  
  try {
    fs.writeFileSync(outputPath, audioData);

    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(outputPath),
      model: "whisper-1",
      language: "en",
    });

    return response.text;
  } finally {
    // Clean up the temporary file
    try {
      fs.unlinkSync(outputPath);
    } catch (cleanupError) {
      console.warn("Failed to cleanup temp file:", cleanupError);
    }
  }
}

function handleErrorResponse(error: any): NextResponse {
  console.error("Speech-to-text error:", error);
  
  if (error.response) {
    return NextResponse.json(
      { error: "Sorry honey, I couldn't hear you clearly. Can you try again?" },
      { status: 500 }
    );
  } else {
    return NextResponse.json(
      { error: "Sorry love, I'm having trouble listening right now. Please try again." },
      { status: 500 }
    );
  }
}