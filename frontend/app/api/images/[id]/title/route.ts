import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'https://backend-rmbg.jchalabi.xyz';

export async function PUT(
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
    const body = await request.json();
    
    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/image/${id}/title`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Origin': request.headers.get('origin') || '',
        'Referer': request.headers.get('referer') || '',
        'X-User-ID': session.user.email, // Pass user ID to backend
      },
      body: JSON.stringify({ title: body.title }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to update title';
      
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
      
      console.error('Update title error:', response.status, errorMessage);
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    // Check if successful response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        const result = await response.json();
        return NextResponse.json(result);
      } catch (jsonError) {
        console.error('Failed to parse success JSON:', jsonError);
        // If JSON parsing fails but request was successful, return a default success response
        return NextResponse.json({ message: 'Title updated successfully', title: body.title });
      }
    } else {
      // Non-JSON success response, return default success
      return NextResponse.json({ message: 'Title updated successfully', title: body.title });
    }

  } catch (error) {
    console.error('Update title API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 