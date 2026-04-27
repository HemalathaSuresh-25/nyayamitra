import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'directory.json');

function readData() {
  try {
    if (!fs.existsSync(path.dirname(DATA_FILE))) {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify({ clients: [], lawyers: [], chats: {}, cases: [] }));
    }
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    // Ensure all required fields exist
    if (!parsed.clients) parsed.clients = [];
    if (!parsed.lawyers) parsed.lawyers = [];
    if (!parsed.chats) parsed.chats = {};
    if (!parsed.cases) parsed.cases = [];
    return parsed;
  } catch {
    return { clients: [], lawyers: [], chats: {}, cases: [] };
  }
}

function writeData(data: any) {
  if (!fs.existsSync(path.dirname(DATA_FILE))) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET /api/directory?type=clients|lawyers|chat|user_chats&chatKey=xxx&email=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const chatKey = searchParams.get('chatKey');
  const email = searchParams.get('email');
  const data = readData();

  if (type === 'clients') return NextResponse.json(data.clients || []);
  if (type === 'lawyers') return NextResponse.json(data.lawyers || []);
  if (type === 'cases') return NextResponse.json(data.cases || []);
  if (type === 'chat' && chatKey) return NextResponse.json(data.chats?.[chatKey] || []);

  // Return all chats involving a specific user email
  if (type === 'user_chats' && email) {
    const userChats: { chatKey: string; messages: any[]; otherEmail: string }[] = [];
    const chats = data.chats || {};
    Object.keys(chats).forEach(key => {
      if (key.includes(email)) {
        const parts = key.split('__');
        if (parts.length === 2) {
          const otherEmail = parts[0] === email ? parts[1] : parts[0];
          userChats.push({ chatKey: key, messages: chats[key], otherEmail });
        }
      }
    });
    return NextResponse.json(userChats);
  }

  return NextResponse.json(data);
}

// POST /api/directory
export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = readData();

  if (body.action === 'register_client') {
    const entry = body.payload;
    const idx = data.clients.findIndex((c: any) => c.email?.toLowerCase() === entry.email?.toLowerCase());
    if (idx > -1) {
      data.clients[idx] = entry;
    } else {
      data.clients.push(entry);
    }
    writeData(data);
    return NextResponse.json({ success: true });
  }

  if (body.action === 'register_lawyer') {
    const entry = body.payload;
    const idx = data.lawyers.findIndex((l: any) => l.email?.toLowerCase() === entry.email?.toLowerCase());
    if (idx > -1) data.lawyers[idx] = entry;
    else data.lawyers.push(entry);
    writeData(data);
    return NextResponse.json({ success: true });
  }

  if (body.action === 'send_message') {
    const { chatKey, message } = body.payload;
    if (!data.chats[chatKey]) data.chats[chatKey] = [];
    data.chats[chatKey].push(message);
    writeData(data);
    return NextResponse.json({ success: true });
  }

  if (body.action === 'accept_client') {
    const { clientEmail, lawyerEmail, lawyerName } = body.payload;
    const idx = data.clients.findIndex((c: any) => c.email?.toLowerCase() === clientEmail?.toLowerCase());
    if (idx > -1) {
      data.clients[idx].status = 'Accepted';
      data.clients[idx].acceptedBy = lawyerName;
      data.clients[idx].acceptedByEmail = lawyerEmail;
      data.clients[idx].acceptedAt = Date.now();
      data.clients[idx].rejectedBy = (data.clients[idx].rejectedBy || []).filter((e: string) => e !== lawyerEmail);
      writeData(data);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  if (body.action === 'reject_client') {
    const { clientEmail, lawyerEmail } = body.payload;
    const idx = data.clients.findIndex((c: any) => c.email?.toLowerCase() === clientEmail?.toLowerCase());
    if (idx > -1) {
      if (!data.clients[idx].rejectedBy) data.clients[idx].rejectedBy = [];
      if (!data.clients[idx].rejectedBy.includes(lawyerEmail)) {
        data.clients[idx].rejectedBy.push(lawyerEmail);
      }
      if (data.clients[idx].acceptedByEmail === lawyerEmail) {
        data.clients[idx].status = 'Pending';
        data.clients[idx].acceptedBy = null;
        data.clients[idx].acceptedByEmail = null;
        data.clients[idx].acceptedAt = null;
      }
      writeData(data);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  if (body.action === 'file_case') {
    const entry = body.payload;
    if (!data.cases) data.cases = [];
    data.cases.unshift(entry);
    writeData(data);
    return NextResponse.json({ success: true });
  }

  if (body.action === 'solve_case') {
    const { caseId, lawyerEmail } = body.payload;
    if (!data.cases) data.cases = [];
    const cIdx = data.cases.findIndex((c: any) => c.id === caseId);
    if (cIdx > -1) {
      const clientEmail = data.cases[cIdx].clientEmail;
      if (!clientEmail || !lawyerEmail) {
        return NextResponse.json({ error: 'Missing email' }, { status: 400 });
      }
      const client = data.clients.find((c: any) => c.email?.toLowerCase() === clientEmail.toLowerCase());
      if (!client || client.acceptedByEmail?.toLowerCase() !== lawyerEmail.toLowerCase()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      data.cases[cIdx].status = 'Solved';
      const clIdx = data.clients.findIndex((c: any) => c.email?.toLowerCase() === clientEmail.toLowerCase());
      if (clIdx > -1) {
        data.clients[clIdx].status = 'Solved';
      }
      writeData(data);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
