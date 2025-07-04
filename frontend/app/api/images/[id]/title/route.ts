import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://backend-rmbg.jchalabi.xyz';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
      },
      body: JSON.stringify({ title: body.title }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to update title';
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        try {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        } catch {
          // Use default error message
        }
      }
      
      console.error('Update title error:', response.status, errorMessage);
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Update title API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 