import { NextRequest, NextResponse } from 'next/server';

const BASE = 'https://services.leadconnectorhq.com';
const VER = process.env.GHL_API_VERSION || '2021-07-28';

interface LocationItem {
  id?: string;
  locationId?: string;
  uid?: string;
  name?: string;
  companyName?: string;
  label?: string;
}

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing x-api-key' }, { status: 401 });
  }

  try {
    const url = new URL('/locations', BASE);
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
    const items = (data?.locations || data?.items || []).map((x: LocationItem) => ({
      id: x.id || x.locationId || x.uid,
      name: x.name || x.companyName || x.label
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

