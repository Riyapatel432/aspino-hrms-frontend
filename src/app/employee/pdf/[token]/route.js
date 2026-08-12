import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const token = resolvedParams.token;
  
  // Use the standard backend API URL (resolved server-side directly to localhost:5000)
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  
  try {
    const res = await fetch(`${backendUrl}/employees/pdf/${token}`, { cache: 'no-store' });
    
    if (!res.ok) {
      return new NextResponse('Employee ID Card PDF not found or invalid token.', { status: 404 });
    }
    
    const pdfBuffer = await res.arrayBuffer();
    
    // Return the PDF response with proper inline headers so it opens directly in browser
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="employee-id-card.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Failed to proxy employee PDF request:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
