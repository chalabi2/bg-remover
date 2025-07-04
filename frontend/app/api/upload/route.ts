import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://backend-rmbg.jchalabi.xyz';

export async function POST(request: NextRequest) {
  try {
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
      },
    });

    if (!response.ok) {
      let errorMessage = 'Upload failed';
      
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

    const result = await response.json();
    return NextResponse.json(result);

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