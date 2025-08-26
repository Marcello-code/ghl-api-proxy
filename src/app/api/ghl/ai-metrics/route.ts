import { NextRequest, NextResponse } from 'next/server';

const BASE = 'https://services.leadconnectorhq.com';
const VER = process.env.GHL_API_VERSION || '2021-07-28';

interface Message {
  direction?: string;
  messageBy?: string;
  authorType?: string;
  fromRole?: string;
  dateAdded?: string;
  createdAt?: string;
  timestamp?: string;
}

interface Conversation {
  id?: string;
  contactId?: string;
}

function isOutboundMessage(m: Message): boolean {
  // Udgående fra virksomheden/system/agent/bot (ikke kontakt)
  return (
    m?.direction === 'outbound' ||
    m?.messageBy === 'user' || m?.messageBy === 'agent' || m?.messageBy === 'bot' || m?.messageBy === 'system' ||
    m?.authorType === 'User' || m?.authorType === 'Agent' || m?.authorType === 'AI' || m?.authorType === 'System'
  );
}

function isContactReply(m: Message): boolean {
  // Indgående fra kontakt
  return (
    m?.direction === 'inbound' ||
    m?.messageBy === 'contact' ||
    m?.authorType === 'Contact' || m?.fromRole === 'contact'
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const apiKey = req.headers.get('x-api-key');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const locationId = searchParams.get('locationId');

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing x-api-key' }, { status: 401 });
  }
  if (!from || !to) {
    return NextResponse.json({ error: 'Missing from/to dates' }, { status: 400 });
  }
  if (!locationId) {
    return NextResponse.json({ error: 'Missing locationId' }, { status: 400 });
  }

  try {
    const startTime = `${from}T00:00:00Z`;
    const endTime = `${to}T23:59:59Z`;

    // Get conversations with pagination
    const conversations: Conversation[] = [];
    let nextPageToken: string | null = null;

    do {
      const url = new URL('/conversations/search', BASE);
      url.searchParams.set('locationId', locationId);
      url.searchParams.set('startDate', startTime);
      url.searchParams.set('endDate', endTime);
      if (nextPageToken) {
        url.searchParams.set('nextPageToken', nextPageToken);
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Version: VER
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json({ error: errorText }, { status: response.status });
      }

      const data = await response.json();
      conversations.push(...(data?.conversations || []));
      nextPageToken = data?.nextPageToken || null;
    } while (nextPageToken);

    // Process conversations to get metrics
    let totalOutboundMessages = 0;
    const reached = new Set<string>();
    const replied = new Set<string>();
    const daily = new Map<string, number>();

    // Process each conversation to get messages
    for (const conversation of conversations) {
      if (!conversation.id) continue;

      // Get messages for this conversation
      let messagePageToken: string | null = null;
      do {
        const msgUrl = new URL(`/conversations/${conversation.id}/messages`, BASE);
        if (messagePageToken) {
          msgUrl.searchParams.set('nextPageToken', messagePageToken);
        }

        const msgResponse = await fetch(msgUrl, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Version: VER
          }
        });

        if (msgResponse.ok) {
          const msgData = await msgResponse.json();
          const messages = msgData?.messages || [];

          for (const message of messages) {
            const messageTime = message.dateAdded || message.createdAt || message.timestamp;
            if (!messageTime) continue;

            const messageDate = new Date(messageTime);
            const startDate = new Date(startTime);
            const endDate = new Date(endTime);

            if (messageDate >= startDate && messageDate <= endDate) {
              if (isOutboundMessage(message)) {
                totalOutboundMessages++;
                if (conversation.contactId) {
                  reached.add(String(conversation.contactId));
                  const day = messageTime.slice(0, 10);
                  daily.set(day, (daily.get(day) || 0) + 1);
                }
              }
              if (isContactReply(message) && conversation.contactId) {
                replied.add(String(conversation.contactId));
              }
            }
          }

          messagePageToken = msgData?.nextPageToken || null;
        } else {
          break;
        }
      } while (messagePageToken);
    }

    const breakdown = Array.from(daily.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      counts: {
        totalOutboundMessages,
        uniqueMessagedContacts: reached.size,
        conversationsReplied: replied.size
      },
      breakdown
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
      }
    });
  } catch (error) {
    console.error('AI Metrics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
    },
  });
}

