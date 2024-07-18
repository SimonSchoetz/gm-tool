import { NextRequest, NextResponse } from 'next/server';

export const routeProtection = async (
  req: NextRequest
): Promise<NextResponse<unknown>> => {
  console.log('>>>>>>>>> | routeProtection is running');
  // Authentication logic
  // const token = req.headers.get('Authorization');

  // if (!token) {
  //   return new NextResponse('Unauthorized', { status: 401 });
  // }

  // Continue to the next middleware or route handler
  return NextResponse.next();
};
