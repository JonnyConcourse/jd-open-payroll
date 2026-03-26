import { NextRequest, NextResponse } from 'next/server';
import { searchPayroll } from '@/lib/socrata';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q') ?? '';
  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }
  try {
    const results = await searchPayroll(query);
    return NextResponse.json(results);
  } catch (err) {
    console.error('Search error:', err);
    return NextResponse.json([], { status: 500 });
  }
}
