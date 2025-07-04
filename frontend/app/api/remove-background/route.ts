import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://backend-rmbg.jchalabi.xyz';

export async function POST(request: NextRequest) {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    
    // Validate that we have an image file
    const imageFile = formData.get('image') as File;
    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided. Please select an image to upload.' },
        { status: 400 }
      );
    }

    // Validate file size (50MB limit)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (imageFile.size > MAX_FILE_SIZE) {
      const fileSizeMB = (imageFile.size / (1024 * 1024)).toFixed(1);
      return NextResponse.json(
        { 
          error: `File size too large (${fileSizeMB}MB). Maximum allowed size is 50MB. Please compress your image or choose a smaller file.` 
        },
        { status: 413 }
      );
    }

    // Validate file type with better error messages
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

    // Create new form data for backend
    const backendFormData = new FormData();
    backendFormData.append('image', imageFile, imageFile.name);

    // Forward the request to the backend
    const backendResponse = await fetch(`${BACKEND_URL}/remove-background`, {
      method: 'POST',
      body: backendFormData,
      headers: {
        'Origin': request.headers.get('origin') || '',
        'Referer': request.headers.get('referer') || '',
      },
    });

    if (!backendResponse.ok) {
      let errorMessage = 'Backend processing failed';
      
      try {
        const errorData = await backendResponse.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        try {
          const errorText = await backendResponse.text();
          errorMessage = errorText || errorMessage;
        } catch {
          // Use default error message
        }
      }
      
      console.error('Backend error:', backendResponse.status, errorMessage);
      
      // Handle specific error cases with user-friendly messages
      if (backendResponse.status === 413) {
        return NextResponse.json(
          { error: 'File size too large for processing. Please try a smaller image.' },
          { status: 413 }
        );
      }
      
      if (backendResponse.status === 403) {
        return NextResponse.json(
          { error: 'Access denied. Please check your permissions or try again later.' },
          { status: 403 }
        );
      }
      
      if (backendResponse.status === 500) {
        return NextResponse.json(
          { error: 'Server error occurred while processing your image. Please try again later.' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: backendResponse.status }
      );
    }

    // Get the processed image blob
    const processedImageBlob = await backendResponse.blob();
    
    // Return the processed image
    return new NextResponse(processedImageBlob, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="processed_${imageFile.name}"`,
      },
    });

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle preflight requests
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