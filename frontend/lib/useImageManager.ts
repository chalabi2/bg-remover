import { useState, useCallback, useRef, useEffect } from 'react';

export interface ImageFile {
  id: string;
  file: File;
  preview: string;
  processed?: string;
  isSelected: boolean;
  filename: string;
  uploadTime: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  progress?: number;
}

export interface ImageManagerState {
  images: ImageFile[];
  selectedImages: string[];
  isProcessing: boolean;
  processingCount: number;
  completedCount: number;
  errorCount: number;
}

export interface ImageManagerActions {
  addImages: (files: File[]) => void;
  removeImage: (id: string) => void;
  removeSelected: () => void;
  removeAll: () => void;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  processImages: (imageIds?: string[]) => Promise<void>;
  clearErrors: () => void;
  downloadImage: (image: ImageFile) => void;
  downloadSelected: () => void;
  downloadAll: () => void;
}

export function useImageManager(): ImageManagerState & ImageManagerActions {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingCount, setProcessingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  
  const processingRef = useRef<Set<string>>(new Set());

  // Load images from localStorage on mount
  useEffect(() => {
    const storedImages = localStorage.getItem('backgroundRemovalImages');
    if (storedImages) {
      try {
        const parsed = JSON.parse(storedImages);
        const validImages = parsed
          .filter((img: any) => img && img.id && img.preview)
          .map((img: any) => ({
            ...img,
            filename: img.filename || `image_${img.id}`,
            uploadTime: img.uploadTime || Date.now(),
            isSelected: false,
            status: img.status || 'pending',
          }));
        setImages(validImages);
      } catch (error) {
        console.error('Error loading images from localStorage:', error);
        localStorage.removeItem('backgroundRemovalImages');
      }
    }
  }, []);

  // Save images to localStorage whenever they change
  useEffect(() => {
    if (images.length > 0) {
      localStorage.setItem('backgroundRemovalImages', JSON.stringify(images));
    } else {
      localStorage.removeItem('backgroundRemovalImages');
    }
  }, [images]);

  const addImages = useCallback((files: File[]) => {
    const newImages: ImageFile[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      filename: file.name,
      uploadTime: Date.now(),
      isSelected: false,
      status: 'pending',
    }));
    setImages(prev => [...prev, ...newImages]);
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages(prev => {
      const image = prev.find(img => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
        if (image.processed) {
          URL.revokeObjectURL(image.processed);
        }
      }
      return prev.filter(img => img.id !== id);
    });
    setSelectedImages(prev => prev.filter(selectedId => selectedId !== id));
  }, []);

  const removeSelected = useCallback(() => {
    const selectedImageObjects = images.filter(img => img.isSelected);
    selectedImageObjects.forEach(image => {
      URL.revokeObjectURL(image.preview);
      if (image.processed) {
        URL.revokeObjectURL(image.processed);
      }
    });
    setImages(prev => prev.filter(img => !img.isSelected));
    setSelectedImages([]);
  }, [images]);

  const removeAll = useCallback(() => {
    images.forEach(image => {
      URL.revokeObjectURL(image.preview);
      if (image.processed) {
        URL.revokeObjectURL(image.processed);
      }
    });
    setImages([]);
    setSelectedImages([]);
    setProcessingCount(0);
    setCompletedCount(0);
    setErrorCount(0);
  }, [images]);

  const toggleSelection = useCallback((id: string) => {
    setImages(prev => 
      prev.map(img => 
        img.id === id ? { ...img, isSelected: !img.isSelected } : img
      )
    );
    setSelectedImages(prev => {
      const image = images.find(img => img.id === id);
      if (image?.isSelected) {
        return prev.filter(selectedId => selectedId !== id);
      } else {
        return [...prev, id];
      }
    });
  }, [images]);

  const selectAll = useCallback(() => {
    setImages(prev => prev.map(img => ({ ...img, isSelected: true })));
    setSelectedImages(images.map(img => img.id));
  }, [images]);

  const deselectAll = useCallback(() => {
    setImages(prev => prev.map(img => ({ ...img, isSelected: false })));
    setSelectedImages([]);
  }, []);

  const clearErrors = useCallback(() => {
    setImages(prev => 
      prev.map(img => 
        img.status === 'error' 
          ? { ...img, status: 'pending', error: undefined }
          : img
      )
    );
    setErrorCount(0);
  }, []);

  const downloadImage = useCallback((image: ImageFile) => {
    if (image.processed) {
      const link = document.createElement('a');
      link.href = image.processed;
      link.download = `processed_${image.filename}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, []);

  const downloadSelected = useCallback(() => {
    const selectedProcessed = images.filter(img => img.isSelected && img.processed);
    selectedProcessed.forEach(image => downloadImage(image));
  }, [images, downloadImage]);

  const downloadAll = useCallback(() => {
    const processedImages = images.filter(img => img.processed);
    processedImages.forEach(image => downloadImage(image));
  }, [images, downloadImage]);

  const processImages = useCallback(async (imageIds?: string[]) => {
    const imagesToProcess = imageIds 
      ? images.filter(img => imageIds.includes(img.id) && !img.processed)
      : images.filter(img => !img.processed);

    if (imagesToProcess.length === 0) return;

    setIsProcessing(true);
    setProcessingCount(imagesToProcess.length);
    processingRef.current.clear();

    // Update status to processing
    setImages(prev => 
      prev.map(img => 
        imagesToProcess.some(processImg => processImg.id === img.id)
          ? { ...img, status: 'processing', progress: 0 }
          : img
      )
    );

    for (const image of imagesToProcess) {
      if (processingRef.current.has(image.id)) continue;
      processingRef.current.add(image.id);

      try {
        const formData = new FormData();
        formData.append('image', image.file, image.filename);

        // Update progress to 25%
        setImages(prev => 
          prev.map(img => 
            img.id === image.id ? { ...img, progress: 25 } : img
          )
        );

        const response = await fetch('/api/remove-background', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const blob = await response.blob();
          const processedUrl = URL.createObjectURL(blob);
          
          setImages(prev => 
            prev.map(img => 
              img.id === image.id 
                ? { ...img, processed: processedUrl, status: 'completed', progress: 100 }
                : img
            )
          );
          setCompletedCount(prev => prev + 1);
        } else {
          let errorMessage = `HTTP ${response.status}: Failed to process image`;
          
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            // If JSON parsing fails, try to get text
            try {
              const errorText = await response.text();
              errorMessage = errorText || errorMessage;
            } catch {
              // Use default error message
            }
          }

          // Handle specific error cases
          if (response.status === 413) {
            errorMessage = `File size too large. Maximum size is 50MB.`;
          } else if (response.status === 403) {
            errorMessage = `Access denied. Please check your permissions.`;
          } else if (response.status === 400) {
            errorMessage = `Invalid file format. Please upload a valid image.`;
          }

          throw new Error(errorMessage);
        }
      } catch (error) {
        console.error('Error processing image:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        setImages(prev => 
          prev.map(img => 
            img.id === image.id 
              ? { ...img, status: 'error', error: errorMessage }
              : img
          )
        );
        setErrorCount(prev => prev + 1);
      } finally {
        processingRef.current.delete(image.id);
        setProcessingCount(prev => prev - 1);
      }
    }

    setIsProcessing(false);
  }, [images]);

  return {
    // State
    images,
    selectedImages,
    isProcessing,
    processingCount,
    completedCount,
    errorCount,
    
    // Actions
    addImages,
    removeImage,
    removeSelected,
    removeAll,
    toggleSelection,
    selectAll,
    deselectAll,
    processImages,
    clearErrors,
    downloadImage,
    downloadSelected,
    downloadAll,
  };
} 