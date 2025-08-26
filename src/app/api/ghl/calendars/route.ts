import { NextRequest, NextResponse } from 'next/server';

const BASE = 'https://services.leadconnectorhq.com';
const VER = process.env.GHL_API_VERSION || '2021-07-28';

interface CalendarItem {
  id?: string;
  name?: string;
  calendarName?: string;
  label?: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const apiKey = req.headers.get('x-api-key');
  const locationId = searchParams.get('locationId');

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing x-api-key' }, { status: 401 });
  }
  if (!locationId) {
    return NextResponse.json({ error: 'Missing locationId' }, { status: 400 });
  }

  try {
    // Try primary endpoint first
    let url = new URL('/calendars', BASE);
    url.searchParams.set('locationId', locationId);

    let response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Version: VER
      }
    });

    // Fallback to alternative endpoint if primary fails
    if (!response.ok) {
      url = new URL(`/locations/${locationId}/calendars`, BASE);
      response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Version: VER
        }
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    const data = await response.json();
    const items = (data?.calendars || data?.items || []).map((x: CalendarItem) => ({
      id: x.id,
      name: x.name || x.calendarName || x.label
    }));

    return NextResponse.json({ items }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
      }
    });
  } catch {
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

