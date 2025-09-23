// Remove old Agents SDK token endpoint (deprecated)
export const runtime = 'edge';
export async function GET() {
  return new Response('deprecated', { status: 410 });
}


