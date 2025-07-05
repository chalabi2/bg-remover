import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'https://backend-rmbg.jchalabi.xyz';

// Force dynamic rendering since we access request headers
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/images`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Origin': request.headers.get('origin') || '',
        'Referer': request.headers.get('referer') || '',
        'X-User-ID': session.user.email, // Pass user ID to backend
      },
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch images';
      
      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          console.error('Failed to parse error JSON:', jsonError);
        }
      } else {
        // Non-JSON response, get as text
        try {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        } catch (textError) {
          console.error('Failed to read error text:', textError);
        }
      }
      
      console.error('List images error:', response.status, errorMessage);
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    // Check if successful response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        const images = await response.json();
        return NextResponse.json(images);
      } catch (jsonError) {
        console.error('Failed to parse images JSON:', jsonError);
        // If JSON parsing fails, return empty array
        return NextResponse.json([]);
      }
    } else {
      // Non-JSON response, return empty array
      console.warn('Backend returned non-JSON response for images list');
      return NextResponse.json([]);
    }

  } catch (error) {
    console.error('List images API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 