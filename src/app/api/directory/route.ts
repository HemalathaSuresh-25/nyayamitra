import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper to map Supabase naming to Frontend naming
function mapCase(c: any) {
  if (!c) return null;
  return {
    ...c,
    issueType: c.category,
    clientEmail: c.client_email,
    lawyerEmail: c.lawyer_email,
    lawyerName: c.lawyer_name
  };
}

// GET /api/directory?type=clients|lawyers|chat|user_chats|cases&chatKey=xxx&email=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const chatKey = searchParams.get('chatKey');
  const email = searchParams.get('email');

  try {
    if (type === 'clients') {
      const { data, error } = await supabase.from('clients').select('*');
      if (error) throw error;
      return NextResponse.json(data || []);
    }

    if (type === 'lawyers') {
      const { data, error } = await supabase.from('lawyers').select('*');
      if (error) throw error;
      return NextResponse.json(data || []);
    }

    if (type === 'cases') {
      const { data, error } = await supabase.from('cases').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return NextResponse.json((data || []).map(mapCase));
    }

    if (type === 'chat' && chatKey) {
      const { data, error } = await supabase.from('chats').select('messages').eq('chat_key', chatKey).single();
      if (error && error.code !== 'PGRST116') throw error;
      return NextResponse.json(data?.messages || []);
    }

    if (type === 'user_chats' && email) {
      const { data, error } = await supabase.from('chats').select('*').ilike('chat_key', `%${email}%`);
      if (error) throw error;
      
      const userChats = (data || []).map(c => {
        const parts = c.chat_key.split('__');
        const otherEmail = parts[0] === email ? parts[1] : parts[0];
        return { chatKey: c.chat_key, messages: c.messages, otherEmail };
      });
      return NextResponse.json(userChats);
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (err: any) {
    console.error('Supabase GET Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/directory
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, payload } = body;

  try {
    if (action === 'register_client') {
      const { error } = await supabase.from('clients').upsert({
        email: payload.email,
        name: payload.name,
        phone: payload.phone,
        address: payload.address,
        about: payload.about,
        role: 'client'
      }, { onConflict: 'email' });
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'register_lawyer') {
      const { error } = await supabase.from('lawyers').upsert({
        email: payload.email,
        name: payload.name,
        bio: payload.about,
        experience: payload.domain,
        phone: payload.phone,
        council_id: payload.council_id,
        solved_cases: payload.solved_cases,
        role: 'lawyer'
      }, { onConflict: 'email' });
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'send_message') {
      const { chatKey, message } = payload;
      const { data: chatData } = await supabase.from('chats').select('messages').eq('chat_key', chatKey).single();
      const messages = chatData?.messages || [];
      messages.push(message);
      
      const { error } = await supabase.from('chats').upsert({
        chat_key: chatKey,
        messages: messages,
        updated_at: new Date().toISOString()
      }, { onConflict: 'chat_key' });
      
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'undo_accept') {
      const { clientEmail } = payload;
      const { error: cErr } = await supabase.from('clients').update({
        status: 'Pending',
        lawyer_email: null
      }).eq('email', clientEmail);
      if (cErr) throw cErr;

      const { error: csErr } = await supabase.from('cases').update({
        status: 'Pending',
        lawyer_email: null,
        lawyer_name: null
      }).eq('client_email', clientEmail).eq('status', 'Accepted');
      
      if (csErr) throw csErr;
      return NextResponse.json({ success: true });
    }

    if (action === 'reject_client') {
      const { clientEmail, lawyerEmail } = payload;
      if (!clientEmail || !lawyerEmail) throw new Error('Missing client or lawyer email');

      // Get current client data
      const { data: clientData, error: fErr } = await supabase
        .from('clients')
        .select('rejected_by')
        .eq('email', clientEmail)
        .single();
      
      if (fErr && fErr.code !== 'PGRST116') throw fErr;

      const currentRejections = clientData?.rejected_by || [];
      if (!currentRejections.includes(lawyerEmail)) {
        const { error: uErr } = await supabase
          .from('clients')
          .update({
            rejected_by: [...currentRejections, lawyerEmail]
          })
          .eq('email', clientEmail);
        
        if (uErr) throw uErr;
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'accept_client') {
      const { clientEmail, lawyerEmail, lawyerName } = payload;
      
      // Check if already accepted to prevent double-acceptance
      const { data: currentClient } = await supabase.from('clients').select('status').eq('email', clientEmail).single();
      if (currentClient?.status === 'Accepted') {
        return NextResponse.json({ error: 'This client is already accepted by another lawyer.' }, { status: 403 });
      }

      const { error: cErr } = await supabase.from('clients').update({
        status: 'Accepted',
        lawyer_email: lawyerEmail
      }).eq('email', clientEmail);
      if (cErr) throw cErr;

      const { error: csErr } = await supabase.from('cases').update({
        status: 'Accepted',
        lawyer_email: lawyerEmail,
        lawyer_name: lawyerName
      }).eq('client_email', clientEmail).eq('status', 'Pending');
      
      if (csErr) throw csErr;
      return NextResponse.json({ success: true });
    }

    if (action === 'file_case') {
      const { client_email, id } = payload;
      if (!client_email) throw new Error('Client email is missing in request');

      const { error } = await supabase.from('cases').insert({
        id: id,
        title: payload.title,
        category: payload.category,
        details: payload.details,
        client_email: client_email,
        client_name: payload.client_name,
        status: 'Pending'
      });
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'solve_case') {
      const { caseId, lawyerEmail } = payload;
      const { data: caseData } = await supabase.from('cases').select('client_email').eq('id', caseId).eq('lawyer_email', lawyerEmail).single();
      if (!caseData) return NextResponse.json({ error: 'Case not found or unauthorized' }, { status: 403 });

      const { error: csErr } = await supabase.from('cases').update({ status: 'Solved' }).eq('id', caseId);
      if (csErr) throw csErr;

      const { error: cErr } = await supabase.from('clients').update({ status: 'Solved' }).eq('email', caseData.client_email);
      if (cErr) throw cErr;

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ 
      error: err.message || 'Server error',
      details: err.details || '',
      hint: err.hint || ''
    }, { status: 500 });
  }
}
