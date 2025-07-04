import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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

export function useImageManager(): ImageManagerState & ImageManagerActions {
  const queryClient = useQueryClient();
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Query for fetching images
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
      return response.json();
    },
    refetchInterval: 5000, // Poll every 5 seconds for updates
  });

  // Upload mutation
  const uploadMutation = useMutation<UploadResponse, Error, { file: File; title?: string }>({
    mutationFn: async ({ file, title }) => {
      const formData = new FormData();
      formData.append('image', file);
      if (title) {
        formData.append('title', title);
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      return response.json();
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

  // Process mutation
  const processMutation = useMutation<void, Error, string>({
    mutationFn: async (imageId: string) => {
      const response = await fetch('/api/remove-background', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file_id: imageId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Processing failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images'] });
    },
    onError: (error) => {
      toast.error(error.message);
      setError(error.message);
    },
  });

  // Update title mutation
  const updateTitleMutation = useMutation<void, Error, { imageId: string; title: string }>({
    mutationFn: async ({ imageId, title }) => {
      const response = await fetch(`/api/images/${imageId}/title`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update title');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images'] });
    },
    onError: (error) => {
      toast.error(error.message);
      setError(error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (imageId: string) => {
      const response = await fetch(`/api/images/${imageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete image');
      }

      return response.json();
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

  // Download actions
  const downloadImage = useCallback(async (imageId: string) => {
    const image = images.find(img => img.id === imageId);
    if (!image) return;

    try {
      const response = await fetch(`/api/images/${imageId}/processed`);
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
  }, [images]);

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