// USPS tracking API temporarily disabled
// TODO: Re-enable when ready to implement real tracking

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json({
    error: 'Tracking Service Disabled',
    message: 'USPS tracking is temporarily disabled. Please check tracking directly on usps.com',
    trackingNumber: (await request.json())?.trackingNumber || 'Unknown'
  }, { status: 503 });
} 