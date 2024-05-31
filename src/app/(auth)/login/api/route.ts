import { getUser } from '@/db/user';
import { HttpStatusCode } from '@/enums';
import { LoginRequestData } from '@/types/requests';
import { LoginResponse } from '@/types/responses';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest
): Promise<NextResponse<LoginResponse>> {
  const body = await req.json();
  const { email }: LoginRequestData = body;

  const user = await getUser(email);

  if (!user.Item) {
    return NextResponse.json({
      message: 'User not found',
      status: HttpStatusCode.NOT_FOUND,
    });
  }

  return NextResponse.json({
    message: 'Success',
    status: HttpStatusCode.OK,
  });
}
