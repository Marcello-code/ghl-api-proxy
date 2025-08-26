import { NextRequest, NextResponse } from 'next/server';

const BASE = 'https://services.leadconnectorhq.com';
const VER = process.env.GHL_API_VERSION || '2021-07-28';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const apiKey = req.headers.get('x-api-key');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const calendarId = searchParams.get('calendarId');

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing x-api-key' }, { status: 401 });
  }
  if (!from || !to) {
    return NextResponse.json({ error: 'Missing from/to dates' }, { status: 400 });
  }
  if (!calendarId) {
    return NextResponse.json({ error: 'Missing calendarId' }, { status: 400 });
  }

  try {
    const startTime = `${from}T00:00:00Z`;
    const endTime = `${to}T23:59:59Z`;

    const url = new URL('/calendars/events', BASE);
    url.searchParams.set('calendarId', calendarId);
    url.searchParams.set('startTime', startTime);
    url.searchParams.set('endTime', endTime);

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
    const events = data?.events || [];

    // Count total appointments
    const count = events.length;

    // Create daily breakdown
    const daily = new Map<string, number>();
    events.forEach((event: any) => {
      const date = event.startTime?.slice(0, 10) || event.dateAdded?.slice(0, 10);
      if (date) {
        daily.set(date, (daily.get(date) || 0) + 1);
      }
    });

    const breakdown = Array.from(daily.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ count, breakdown }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
      }
    });
  } catch (error) {
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

