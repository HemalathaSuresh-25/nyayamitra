import https from 'https';
import { NextResponse } from 'next/server';

async function callGroq(apiKey: string, prompt: string): Promise<string> {
  const data = JSON.stringify({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }]
  });

  const options = {
    hostname: 'api.groq.com',
    path: '/openai/v1/chat/completions',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (res.statusCode === 200 && json.choices?.[0]?.message?.content) {
            resolve(json.choices[0].message.content);
          } else {
            const groqErr = json.error?.message || JSON.stringify(json);
            resolve(`Groq API Error: ${groqErr}`);
          }
        } catch (e) { resolve("Groq Parse Error: " + body); }
      });
    });
    req.on('error', (e) => resolve(`Groq Network Error: ${e.message}`));
    req.write(data);
    req.end();
  });
}

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const data = JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] });
  const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve(json.candidates?.[0]?.content?.parts?.[0]?.text || "Gemini Error");
        } catch (e) { resolve("Gemini Error"); }
      });
    });
    req.on('error', () => resolve("Gemini Error"));
    req.write(data);
    req.end();
  });
}

async function callAI(prompt: string): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (groqKey) {
    try {
      const groqRes = await callGroq(groqKey.trim(), prompt);
      if (!groqRes.includes("Groq API Error")) return groqRes;
    } catch (e) {}
  }

  if (geminiKey) {
    return callGemini(geminiKey.trim(), prompt);
  }

  return "Error: No AI providers configured.";
}

export async function POST(req: Request) {
  try {
    const { query, language = 'en' } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required.' }, { status: 400 });
    }

    const languageMap: Record<string, string> = {
      'en-IN': 'English', 'hi-IN': 'Hindi', 'ta-IN': 'Tamil', 'te-IN': 'Telugu', 'bn-IN': 'Bengali'
    };
    const targetLanguageName = languageMap[language] || 'English';

    const prompt = `You are NyayaMitra (Justice Friend), an AI Legal Aid Companion for Indian citizens.
    User Query: "${query}"
    Task: Explain legal rights in SIMPLE language in ${targetLanguageName}.`;

    const aiText = await callAI(prompt);

    return NextResponse.json({ result: aiText });
  } catch (error: any) {
    return NextResponse.json({ error: `API Error: ${error.message}` }, { status: 500 });
  }
}
