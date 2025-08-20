import { NextResponse } from 'next/server';

// No-op middleware: lets every request pass through
export function middleware() {
  return NextResponse.next();
}

// No matchers means it won't run for any paths
export const config = {
  matcher: [],
};
