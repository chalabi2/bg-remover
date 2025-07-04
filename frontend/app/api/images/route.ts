import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://backend-rmbg.jchalabi.xyz';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${BACKEND_URL}/images`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Origin': request.headers.get('origin') || '',
        'Referer': request.headers.get('referer') || '',
      },
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch images';
      
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
      
      console.error('List images error:', response.status, errorMessage);
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const images = await response.json();
    return NextResponse.json(images);

  } catch (error) {
    console.error('List images API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 