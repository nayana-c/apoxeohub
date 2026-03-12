import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get('refreshToken')?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { success: false, message: 'Refresh token not found.' },
      { status: 401 }
    );
  }

  const backendRes = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { Cookie: `refreshToken=${refreshToken}` },
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
