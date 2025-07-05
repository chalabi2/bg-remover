import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

export interface ServerImage {
  id: string;
  title: string;
  original_filename: string;
  upload_time: string;
  status: 'uploaded' | 'processing' | 'completed' | 'error';
  processed: boolean;
  has_original: boolean;
  has_processed: boolean;
}

export interface UploadResponse {
  id: string;
  title: string;
  message: string;
}

export interface ImageManagerState {
  images: ServerImage[];
  isLoading: boolean;
  isUploading: boolean;
  isProcessing: boolean;
  selectedImages: Set<string>;
  error: string | null;
}

export interface ImageManagerActions {
  uploadImage: (file: File, title?: string) => Promise<void>;
  processImage: (imageId: string) => Promise<void>;
  processSelectedImages: () => Promise<void>;
  updateImageTitle: (imageId: string, title: string) => Promise<void>;
  deleteImage: (imageId: string) => Promise<void>;
  deleteSelectedImages: () => Promise<void>;
  selectImage: (imageId: string) => void;
  deselectImage: (imageId: string) => void;
  selectAllImages: () => void;
  deselectAllImages: () => void;
  downloadImage: (imageId: string) => Promise<void>;
  downloadSelectedImages: () => Promise<void>;
  refreshImages: () => void;
}

// Progress tracking hook for real-time updates with reconnection
export function useProcessingProgress(imageId: string | null) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'starting' | 'processing' | 'completed' | 'error'>('idle');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const { data: session } = useSession();
  const maxReconnectAttempts = 5;
  
  useEffect(() => {
    if (!imageId || !session?.user?.email) return;
    
    let eventSource: EventSource | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;
    
    const connectSSE = () => {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-rmbg.jchalabi.xyz';
      eventSource = new EventSource(`${BACKEND_URL}/process-progress/${imageId}`, {
        withCredentials: false
      });
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.error) {
            setStatus('error');
            setProgress(0);
            return;
          }
          
          setStatus(data.status);
          setProgress(data.progress || 0);
          
          // Reset reconnection attempts on successful message
          setReconnectAttempts(0);
          
          if (data.status === 'completed' || data.status === 'error') {
            eventSource?.close();
          }
        } catch (error) {
          console.error('Error parsing SSE data:', error);
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        eventSource?.close();
        
        // Attempt reconnection if under max attempts
        if (reconnectAttempts < maxReconnectAttempts) {
          const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
          reconnectTimer = setTimeout(() => {
            console.log(`Reconnecting SSE (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
            setReconnectAttempts(prev => prev + 1);
          }, backoffTime);
        } else {
          setStatus('error');
          console.error('Max SSE reconnection attempts reached');
        }
      };
    };
    
    connectSSE();
    
    return () => {
      eventSource?.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [imageId, session?.user?.email, reconnectAttempts]);
  
  return { progress, status, reconnectAttempts };
}

export function useImageManager(): ImageManagerState & ImageManagerActions {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-rmbg.jchalabi.xyz';

  // Query for fetching images - use Next.js API route
  const {
    data: images = [],
    isLoading,
    refetch: refreshImages,
  } = useQuery<ServerImage[]>({
    queryKey: ['images'],
    queryFn: async () => {
      const response = await fetch('/api/images');
      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }
      
      // Try to parse JSON response, but handle errors gracefully
      try {
        return await response.json();
      } catch (jsonError) {
        console.error('Failed to parse images JSON:', jsonError);
        return []; // Return empty array if JSON parsing fails
      }
    },
    refetchInterval: 5000, // Poll every 5 seconds for updates
  });

  // Upload mutation - call backend directly
  const uploadMutation = useMutation<UploadResponse, Error, { file: File; title?: string }>({
    mutationFn: async ({ file, title }) => {
      if (!session?.user?.email) {
        throw new Error('Authentication required');
      }

      const formData = new FormData();
      formData.append('image', file);
      if (title) {
        formData.append('title', title);
      }

      const response = await fetch(`${BACKEND_URL}/upload`, {
        method: 'POST',
        headers: {
          'X-User-ID': session.user.email,
        },
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = 'Upload failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          // If JSON parsing fails, use the status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Try to parse JSON response, but don't require it
      try {
        return await response.json();
      } catch (jsonError) {
        // If JSON parsing fails but response was successful, return success
        return { 
          id: 'unknown', 
          title: title || 'Unknown', 
          message: 'Upload successful' 
        };
      }
    },
    onSuccess: (data) => {
      toast.success(`Image "${data.title}" uploaded successfully`);
      queryClient.invalidateQueries({ queryKey: ['images'] });
    },
    onError: (error) => {
      toast.error(error.message);
      setError(error.message);
    },
  });

  // Process mutation - call backend directly
  const processMutation = useMutation<void, Error, string>({
    mutationFn: async (imageId: string) => {
      if (!session?.user?.email) {
        throw new Error('Authentication required');
      }

      console.log('🔄 Calling backend directly:', `${BACKEND_URL}/remove-background`);
      
      const response = await fetch(`${BACKEND_URL}/remove-background`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': session.user.email, // Pass user ID to backend
        },
        body: JSON.stringify({ file_id: imageId }),
      });

      console.log('📤 Backend response status:', response.status);

      if (!response.ok) {
        let errorMessage = 'Processing failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.log('❌ Backend error:', errorData);
        } catch (jsonError) {
          // If JSON parsing fails, use the status text
          errorMessage = response.statusText || errorMessage;
          console.log('❌ Backend error (non-JSON):', errorMessage);
        }
        throw new Error(errorMessage);
      }

      // Try to parse JSON response, but don't require it
      try {
        const result = await response.json();
        console.log('✅ Backend success:', result);
        return result;
      } catch (jsonError) {
        // If JSON parsing fails but response was successful, return success
        return { message: 'Background removed successfully' };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images'] });
    },
    onError: (error) => {
      console.error('💥 Process mutation error:', error);
      toast.error(error.message);
      setError(error.message);
    },
  });

  // Update title mutation - call backend directly
  const updateTitleMutation = useMutation<void, Error, { imageId: string; title: string }>({
    mutationFn: async ({ imageId, title }) => {
      if (!session?.user?.email) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${BACKEND_URL}/image/${imageId}/title`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': session.user.email,
        },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to update title';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          // If JSON parsing fails, use the status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Try to parse JSON response, but don't require it
      try {
        return await response.json();
      } catch (jsonError) {
        // If JSON parsing fails but response was successful, return success
        return { message: 'Title updated successfully' };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images'] });
    },
    onError: (error) => {
      toast.error(error.message);
      setError(error.message);
    },
  });

  // Delete mutation - call backend directly
  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (imageId: string) => {
      if (!session?.user?.email) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${BACKEND_URL}/image/${imageId}`, {
        method: 'DELETE',
        headers: {
          'X-User-ID': session.user.email,
        },
      });

      if (!response.ok) {
        let errorMessage = 'Failed to delete image';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          // If JSON parsing fails, use the status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Try to parse JSON response, but don't require it
      try {
        return await response.json();
      } catch (jsonError) {
        // If JSON parsing fails but response was successful, return success
        return { message: 'Image deleted successfully' };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images'] });
    },
    onError: (error) => {
      toast.error(error.message);
      setError(error.message);
    },
  });

  // Upload image
  const uploadImage = useCallback(async (file: File, title?: string) => {
    setError(null);
    await uploadMutation.mutateAsync({ file, title });
  }, [uploadMutation]);

  // Process single image
  const processImage = useCallback(async (imageId: string) => {
    setError(null);
    toast.info('Processing image...');
    await processMutation.mutateAsync(imageId);
    toast.success('Background removed successfully!');
  }, [processMutation]);

  // Process selected images
  const processSelectedImages = useCallback(async () => {
    if (selectedImages.size === 0) {
      toast.error('No images selected');
      return;
    }

    setError(null);
    const selectedArray = Array.from(selectedImages);
    
    toast.info(`Processing ${selectedArray.length} image${selectedArray.length > 1 ? 's' : ''}...`);
    
    let successCount = 0;
    let errorCount = 0;

    for (const imageId of selectedArray) {
      try {
        await processMutation.mutateAsync(imageId);
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Failed to process image ${imageId}:`, error);
      }
    }

    if (successCount > 0) {
      toast.success(`Successfully processed ${successCount} image${successCount > 1 ? 's' : ''}`);
    }
    
    if (errorCount > 0) {
      toast.error(`Failed to process ${errorCount} image${errorCount > 1 ? 's' : ''}`);
    }
  }, [selectedImages, processMutation]);

  // Update image title
  const updateImageTitle = useCallback(async (imageId: string, title: string) => {
    setError(null);
    await updateTitleMutation.mutateAsync({ imageId, title });
  }, [updateTitleMutation]);

  // Delete single image
  const deleteImage = useCallback(async (imageId: string) => {
    setError(null);
    const imageToDelete = images.find(img => img.id === imageId);
    const imageName = imageToDelete?.title || 'Unknown';
    
    await deleteMutation.mutateAsync(imageId);
    toast.success(`Image "${imageName}" deleted successfully`);
    
    // Remove from selection if it was selected
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      newSet.delete(imageId);
      return newSet;
    });
  }, [deleteMutation, images]);

  // Delete selected images
  const deleteSelectedImages = useCallback(async () => {
    if (selectedImages.size === 0) {
      toast.error('No images selected');
      return;
    }

    setError(null);
    const selectedArray = Array.from(selectedImages);
    
    let successCount = 0;
    let errorCount = 0;

    for (const imageId of selectedArray) {
      try {
        await deleteMutation.mutateAsync(imageId);
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Failed to delete image ${imageId}:`, error);
      }
    }

    if (successCount > 0) {
      toast.success(`Successfully deleted ${successCount} image${successCount > 1 ? 's' : ''}`);
      setSelectedImages(new Set()); // Clear selection
    }
    
    if (errorCount > 0) {
      toast.error(`Failed to delete ${errorCount} image${errorCount > 1 ? 's' : ''}`);
    }
  }, [selectedImages, deleteMutation]);

  // Selection actions
  const selectImage = useCallback((imageId: string) => {
    setSelectedImages(prev => new Set(Array.from(prev).concat(imageId)));
  }, []);

  const deselectImage = useCallback((imageId: string) => {
    setSelectedImages(prev => {
      const newSet = new Set(Array.from(prev));
      newSet.delete(imageId);
      return newSet;
    });
  }, []);

  const selectAllImages = useCallback(() => {
    setSelectedImages(new Set(images.map(img => img.id)));
  }, [images]);

  const deselectAllImages = useCallback(() => {
    setSelectedImages(new Set());
  }, []);

  // Download actions - call backend directly
  const downloadImage = useCallback(async (imageId: string) => {
    const image = images.find(img => img.id === imageId);
    if (!image) return;

    if (!session?.user?.email) {
      toast.error('Authentication required');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/image/${imageId}/processed`, {
        method: 'GET',
        headers: {
          'X-User-ID': session.user.email,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download image');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${image.title || 'image'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Downloaded "${image.title}"`);
    } catch (error) {
      toast.error('Failed to download image');
      console.error('Download error:', error);
    }
  }, [images, session?.user?.email, BACKEND_URL]);

  const downloadSelectedImages = useCallback(async () => {
    if (selectedImages.size === 0) {
      toast.error('No images selected');
      return;
    }

    const selectedArray = Array.from(selectedImages);
    const processedImages = images.filter(img => 
      selectedArray.includes(img.id) && img.processed
    );

    if (processedImages.length === 0) {
      toast.error('No processed images selected');
      return;
    }

    if (processedImages.length === 1) {
      await downloadImage(processedImages[0].id);
      return;
    }

    // For multiple images, we'd need to implement zip download
    // For now, download them one by one
    toast.info(`Downloading ${processedImages.length} images...`);
    
    for (const image of processedImages) {
      await downloadImage(image.id);
    }
  }, [selectedImages, images, downloadImage]);

  return {
    // State
    images,
    isLoading,
    isUploading: uploadMutation.isPending,
    isProcessing: processMutation.isPending,
    selectedImages,
    error,
    
    // Actions
    uploadImage,
    processImage,
    processSelectedImages,
    updateImageTitle,
    deleteImage,
    deleteSelectedImages,
    selectImage,
    deselectImage,
    selectAllImages,
    deselectAllImages,
    downloadImage,
    downloadSelectedImages,
    refreshImages,
  };
} 