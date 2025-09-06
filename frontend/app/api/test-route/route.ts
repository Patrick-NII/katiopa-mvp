import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Route test fonctionnelle !',
    timestamp: new Date().toISOString()
  })
}
