import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'https://backend-rmbg.jchalabi.xyz';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    const response = await fetch(`${BACKEND_URL}/image/${id}/processed`, {
      method: 'GET',
      headers: {
        'Origin': request.headers.get('origin') || '',
        'Referer': request.headers.get('referer') || '',
        'X-User-ID': session.user.email, // Pass user ID to backend
      },
    });

    if (!response.ok) {
      let errorMessage = 'Failed to get processed image';
      
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
      
      console.error('Get processed image error:', response.status, errorMessage);
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    // For image responses, return the blob directly
    const imageBlob = await response.blob();
    const contentType = response.headers.get('content-type') || 'image/png';
    
    return new NextResponse(imageBlob, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': imageBlob.size.toString(),
        'Cache-Control': 'public, max-age=3600',
        'Accept-Ranges': 'bytes',
      },
    });

  } catch (error) {
    console.error('Get processed image API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 