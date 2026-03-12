import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

export async function POST(req: NextRequest) {
  const authorization = req.headers.get('Authorization');
  const refreshToken = req.cookies.get('refreshToken')?.value;

  // Best-effort call to backend to invalidate the token server-side
  await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      ...(authorization ? { Authorization: authorization } : {}),
      ...(refreshToken ? { Cookie: `refreshToken=${refreshToken}` } : {}),
    },
  }).catch(() => {});

  const response = NextResponse.json({ success: true, message: 'Logged out successfully.' });
  response.cookies.delete('refreshToken');
  return response;
}
