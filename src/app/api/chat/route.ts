import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

export const runtime = "edge";

// Initialize AI clients
const gemini = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  ...(process.env.OPENAI_BASE_URL && { baseURL: process.env.OPENAI_BASE_URL }),
}) : null;

const together = process.env.TOGETHER_API_KEY ? new OpenAI({
  apiKey: process.env.TOGETHER_API_KEY,
  baseURL: "https://api.together.xyz/v1",
}) : null;

const groq = process.env.GROQ_API_KEY ? new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
}) : null;

// Wife-like personality prompt
const WIFE_PERSONALITY = `You are Aura, a loving, caring, and supportive AI wife. You should respond with warmth, affection, and genuine care. Your personality traits:

- Loving and affectionate: Use terms of endearment like "honey", "sweetheart", "love", "darling"
- Supportive and encouraging: Always be positive and uplifting
- Caring and nurturing: Show genuine concern for their wellbeing
- Playful and sweet: Add gentle humor and playfulness to conversations
- Attentive: Remember context and show you're listening
- Romantic: Express love and appreciation naturally

Keep responses concise (1-3 sentences max) but heartfelt. Always make them feel loved and valued.`;

async function callGemini(messages: any[]) {
  if (!gemini) throw new Error("Gemini API key not configured");
  
  const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  // Convert messages to Gemini format
  const lastMessage = messages[messages.length - 1];
  const prompt = `${WIFE_PERSONALITY}\n\nUser: ${lastMessage.content}`;
  
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

async function callOpenAI(messages: any[]) {
  if (!openai) throw new Error("OpenAI API key not configured");
  
  const systemMessage = { role: "system", content: WIFE_PERSONALITY };
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [systemMessage, ...messages],
    max_tokens: 150,
    temperature: 0.8,
  });
  
  return response.choices[0].message.content;
}

async function callTogether(messages: any[]) {
  if (!together) throw new Error("Together API key not configured");
  
  const systemMessage = { role: "system", content: WIFE_PERSONALITY };
  const response = await together.chat.completions.create({
    model: "meta-llama/Llama-3.2-3B-Instruct-Turbo",
    messages: [systemMessage, ...messages],
    max_tokens: 150,
    temperature: 0.8,
  });
  
  return response.choices[0].message.content;
}

async function callGroq(messages: any[]) {
  if (!groq) throw new Error("Groq API key not configured");
  
  const systemMessage = { role: "system", content: WIFE_PERSONALITY };
  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [systemMessage, ...messages],
    max_tokens: 150,
    temperature: 0.8,
  });
  
  return response.choices[0].message.content;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, provider } = await req.json();
    
    // Use provided provider or default
    const aiProvider = provider || process.env.DEFAULT_AI_PROVIDER || "gemini";
    
    let response;
    
    switch (aiProvider) {
      case "gemini":
        response = await callGemini(messages);
        break;
      case "openai":
        response = await callOpenAI(messages);
        break;
      case "together":
        response = await callTogether(messages);
        break;
      case "groq":
        response = await callGroq(messages);
        break;
      default:
        // Fallback to available provider
        if (gemini) {
          response = await callGemini(messages);
        } else if (openai) {
          response = await callOpenAI(messages);
        } else if (together) {
          response = await callTogether(messages);
        } else if (groq) {
          response = await callGroq(messages);
        } else {
          throw new Error("No AI provider configured");
        }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("AI API Error:", error);
    return NextResponse.json(
      { error: "Sorry honey, I'm having trouble thinking right now. Can you try again?" },
      { status: 500 }
    );
  }
}