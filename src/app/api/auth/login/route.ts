import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

export async function POST(req: NextRequest) {
  const body = await req.json();

  const backendRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await backendRes.json();
  const response = NextResponse.json(data, { status: backendRes.status });

  if (backendRes.ok) {
    const setCookieHeader = backendRes.headers.get('set-cookie');
    if (setCookieHeader) {
      const match = setCookieHeader.match(/refreshToken=([^;]+)/);
      if (match) {
        response.cookies.set('refreshToken', match[1], {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60,
          path: '/',
        });
      }
    }
  }

  return response;
}
