export async function POST(req: Request) {
  const { name } = await req.json();
  console.log('sign up PUT running', name);
  return Response.json('PUT handler for /sign-up');
}
