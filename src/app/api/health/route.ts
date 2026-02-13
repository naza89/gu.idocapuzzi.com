import { NextResponse } from 'next/server';

/**
 * GET /api/health
 * 
 * Health check endpoint. Returns the current status and timestamp.
 * Used to verify the deployment is working and for Galicia NAVE
 * connectivity validation.
 */
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV,
    });
}
