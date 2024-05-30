import { getUser } from '@/db/user';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, res: NextResponse) {
  const body = await req.json();
  const { email } = body;

  const user = await getUser(email);
  if (!user.Item) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ status: 'success', email }, { status: 200 });
}
