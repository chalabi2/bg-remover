import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'https://backend-rmbg.jchalabi.xyz';

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    
    const imageFile = formData.get('image') as File;
    const title = formData.get('title') as string;
    
    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate file size (50MB limit)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (imageFile.size > MAX_FILE_SIZE) {
      const fileSizeMB = (imageFile.size / (1024 * 1024)).toFixed(1);
      return NextResponse.json(
        { 
          error: `File size too large (${fileSizeMB}MB). Maximum allowed size is 50MB.` 
        },
        { status: 413 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp',
      'image/heic',
      'image/heif',
      'image/tiff',
      'image/tif'
    ];
    
    if (!allowedTypes.includes(imageFile.type.toLowerCase())) {
      return NextResponse.json(
        { 
          error: `Unsupported file type: ${imageFile.type}. Please upload a JPEG, PNG, GIF, BMP, WebP, HEIC, HEIF, or TIFF image.` 
        },
        { status: 400 }
      );
    }

    // Create form data for backend
    const backendFormData = new FormData();
    backendFormData.append('image', imageFile, imageFile.name);
    if (title) {
      backendFormData.append('title', title);
    }

    // Upload to backend
    const response = await fetch(`${BACKEND_URL}/upload`, {
      method: 'POST',
      body: backendFormData,
      headers: {
        'Origin': request.headers.get('origin') || '',
        'Referer': request.headers.get('referer') || '',
        'X-User-ID': session.user.email, // Pass user ID to backend
      },
    });

    if (!response.ok) {
      let errorMessage = 'Upload failed';
      
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
      
      console.error('Upload error:', response.status, errorMessage);
      
      if (response.status === 413) {
        return NextResponse.json(
          { error: 'File size too large for upload. Please try a smaller image.' },
          { status: 413 }
        );
      }
      
      if (response.status === 400 && errorMessage.includes('Content not allowed')) {
        return NextResponse.json(
          { error: 'This image contains content that is not allowed. Please upload a different image.' },
          { status: 400 }
        );
      }
      
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
        return NextResponse.json({ 
          id: 'unknown', 
          title: title || imageFile.name, 
          message: 'Image uploaded successfully' 
        });
      }
    } else {
      // Non-JSON success response, return default success
      return NextResponse.json({ 
        id: 'unknown', 
        title: title || imageFile.name, 
        message: 'Image uploaded successfully' 
      });
    }

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 