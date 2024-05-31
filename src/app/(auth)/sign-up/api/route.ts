import { createUser } from '@/db/user';
import { HttpStatusCode } from '@/enums';
import { SignUpRequestData } from '@/types/requests';
import { SignUpResponse } from '@/types/responses';
import { NextRequest, NextResponse } from 'next/server';
import { HttpException } from '@/util/api';

export async function POST(
  req: NextRequest
): Promise<NextResponse<SignUpResponse>> {
  const body = await req.json();
  const { email, displayName, createdAt }: SignUpRequestData = body;

  try {
    await createUser({ email, displayName, createdAt });
    return NextResponse.json({
      message: 'User created',
      status: HttpStatusCode.CREATED,
    });
  } catch (error: any) {
    const errorMessage =
      error.message === 'The conditional request failed'
        ? 'User already exists'
        : error.message;

    throw new HttpException(errorMessage, error.$metadata.httpStatusCode);
  }
}
