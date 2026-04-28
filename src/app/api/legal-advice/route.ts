import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function callGemini(apiKey: string, prompt: string, retries = 3): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  // Using the latest 2026 models: gemini-2.5-flash or gemini-flash-latest
  let modelName = "gemini-2.5-flash";
  let model = genAI.getGenerativeModel({ model: modelName });
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text() || "I couldn't generate a response. Please try again.";
    } catch (err: any) {
      console.error(`Gemini attempt ${attempt}/${retries} failed:`, err?.message);
      
      // Fallback to the latest alias if 2.5 fails
      if (err?.message?.includes('404') && modelName !== "gemini-flash-latest") {
        console.log("Switching to gemini-flash-latest...");
        modelName = "gemini-flash-latest";
        model = genAI.getGenerativeModel({ model: modelName });
        continue;
      }

      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, attempt * 1000));
    }
  }
  throw new Error('All retry attempts failed');
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API Key is not configured. Add GEMINI_API_KEY to .env.local' }, { status: 500 });
    }

    const { query, language = 'en' } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required.' }, { status: 400 });
    }

    const languageMap: Record<string, string> = {
      'en-IN': 'English',
      'hi-IN': 'Hindi',
      'ta-IN': 'Tamil',
      'te-IN': 'Telugu',
      'bn-IN': 'Bengali'
    };
    const targetLanguageName = languageMap[language] || 'English';

    const prompt = `You are NyayaMitra (Justice Friend), an AI Legal Aid Companion for Indian citizens.
    Your target audience is people in rural and low-income urban areas who may not afford lawyers.
    
    User Query: "${query}"
    
    Task:
    1. Understand the user's problem.
    2. Classify the legal domain (e.g., Consumer, Labor, Family, Property, Criminal).
    3. Explain their legal rights in SIMPLE, NON-TECHNICAL language. Do not use complex legal jargon.
    4. Suggest the next steps they should take (e.g., which authority to approach, what document to file).
    5. Reply ONLY in the requested language: ${targetLanguageName} (Very Important! Do not use English if another language is requested).
    
    Format the response clearly using bullet points or short paragraphs for readability.`;

    const aiText = await callGemini(apiKey, prompt);

    return NextResponse.json({ result: aiText });
  } catch (error: any) {
    console.error('Gemini API Error:', error?.message || error);
    
    const errMsg = error?.message || 'Unknown error';
    
    if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('401')) {
      return NextResponse.json({ error: 'Your Gemini API key is invalid or expired. Please get a new key from https://aistudio.google.com/apikey' }, { status: 401 });
    }
    if (errMsg.includes('RATE_LIMIT') || errMsg.includes('429')) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please wait a moment and try again.' }, { status: 429 });
    }

    return NextResponse.json({ error: `API Error: ${errMsg}` }, { status: 500 });
  }
}
