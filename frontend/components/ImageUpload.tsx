import React, { useCallback, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileImage, CheckCircle, AlertCircle, Zap, Settings } from 'lucide-react';

interface ImageUploadProps {
  onUpload: (file: File, title?: string) => Promise<void>;
  isUploading: boolean;
}

// Image compression utility
const compressImage = async (file: File, maxWidth: number = 2048, maxHeight: number = 2048, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      // Only resize if image is larger than max dimensions
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        } else {
          resolve(file); // Fallback to original
        }
      }, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

export function ImageUpload({ onUpload, isUploading }: ImageUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'compressing' | 'uploading' | 'success' | 'error'>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [compressionEnabled, setCompressionEnabled] = useState(true);
  const [compressionStats, setCompressionStats] = useState<{original: number; compressed: number} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setOriginalFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Set default title from filename (without extension)
      const filename = file.name;
      const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
      setTitle(nameWithoutExt || filename);
      
      // Auto-compress large images
      if (compressionEnabled && file.size > 2 * 1024 * 1024) { // > 2MB
        setUploadStatus('compressing');
        try {
          const compressedFile = await compressImage(file);
          setUploadedFile(compressedFile);
          setCompressionStats({
            original: file.size,
            compressed: compressedFile.size
          });
          setUploadStatus('idle');
        } catch (error) {
          console.error('Compression failed:', error);
          setUploadedFile(file); // Use original if compression fails
          setUploadStatus('idle');
        }
      } else {
        setUploadedFile(file);
        setUploadStatus('idle');
      }
    }
  }, [compressionEnabled]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp', '.heic', '.heif', '.tiff', '.tif']
    },
    maxFiles: 1,
    disabled: isUploading || isProcessing,
    noClick: false, // Ensure click is enabled
    noKeyboard: false // Ensure keyboard access is enabled
  });

  const handleUpload = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setUploadStatus('uploading');
    
    try {
      await onUpload(uploadedFile, title.trim() || uploadedFile.name);
      
      setUploadStatus('success');
      
      // Show success state briefly, then reset
      setTimeout(() => {
        setUploadedFile(null);
        setOriginalFile(null);
        setTitle('');
        setPreviewUrl(null);
        setUploadStatus('idle');
        setCompressionStats(null);
      }, 2000);
      
    } catch (error) {
      setUploadStatus('error');
      console.error('Upload error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setUploadedFile(null);
    setOriginalFile(null);
    setTitle('');
    setUploadStatus('idle');
    setCompressionStats(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && uploadedFile && !isUploading && !isProcessing) {
      handleUpload();
    }
  };

  const handleClick = () => {
    if (!isUploading && !isProcessing) {
      // Manually trigger file input click as fallback
      if (fileInputRef.current) {
        fileInputRef.current.click();
      } else {
        // Use react-dropzone's open function
        open();
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Cleanup preview URL on unmount
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (uploadedFile) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-card rounded-lg border-2 border-dashed border-border p-6">
          {/* File preview */}
          {previewUrl && (
            <div className="mb-4 relative">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-32 object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black/0 rounded-lg transition-colors hover:bg-black/5"></div>
            </div>
          )}
          
          {/* File info */}
          <div className="flex items-center space-x-3 mb-4">
            <FileImage className="h-8 w-8 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {uploadedFile.name}
              </p>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>{formatFileSize(uploadedFile.size)}</span>
                {compressionStats && (
                  <div className="flex items-center space-x-1">
                    <Zap className="h-3 w-3 text-green-500" />
                    <span className="text-green-600 dark:text-green-400">
                      {Math.round((1 - compressionStats.compressed / compressionStats.original) * 100)}% smaller
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="text-muted-foreground hover:text-foreground flex-shrink-0"
              disabled={isUploading || isProcessing}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Compression status */}
          {uploadStatus === 'compressing' && (
            <div className="mb-4 flex items-center space-x-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">Optimizing image...</span>
            </div>
          )}

          {/* Upload status */}
          {uploadStatus === 'uploading' && (
            <div className="mb-4 flex items-center space-x-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">Uploading...</span>
            </div>
          )}

          {/* Success/Error states */}
          {uploadStatus === 'success' && (
            <div className="mb-4 flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Upload successful!</span>
            </div>
          )}
          
          {uploadStatus === 'error' && (
            <div className="mb-4 flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Upload failed. Please try again.</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">
                Image Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter a title for your image..."
                className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                disabled={isUploading || isProcessing}
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleUpload}
                disabled={isUploading || isProcessing || uploadStatus === 'success' || uploadStatus === 'compressing'}
                className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUploading || isProcessing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </div>
                ) : uploadStatus === 'compressing' ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Optimizing...
                  </div>
                ) : uploadStatus === 'success' ? (
                  <div className="flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Uploaded!
                  </div>
                ) : (
                  'Upload Image'
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={isUploading || isProcessing}
                className="px-4 py-2 border border-border text-foreground rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Compression settings */}
      <div className="mb-4 p-3 bg-card rounded-lg border border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Smart Optimization</span>
          </div>
          <button
            onClick={() => setCompressionEnabled(!compressionEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              compressionEnabled 
                ? 'bg-primary shadow-sm' 
                : 'bg-muted border border-border shadow-inner'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full transition-all duration-200 shadow-sm ${
                compressionEnabled 
                  ? 'translate-x-6 bg-primary-foreground border border-primary/10' 
                  : 'translate-x-1 bg-background border border-border'
              }`}
            />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {compressionEnabled 
            ? "Large images will be optimized for faster upload" 
            : "Upload images at original quality"
          }
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`bg-card rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? 'border-primary bg-accent scale-105'
            : 'border-border hover:border-primary hover:bg-accent/50'
        } ${isUploading || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} ref={fileInputRef} style={{ display: 'none' }} />
        <Upload className={`mx-auto h-12 w-12 text-muted-foreground mb-4 transition-transform duration-200 ${
          isDragActive ? 'scale-110 text-primary' : ''
        }`} />
        <div className="space-y-2">
          <p className="text-lg font-medium text-foreground">
            {isDragActive ? 'Drop the image here' : 'Upload an image'}
          </p>
          <p className="text-sm text-muted-foreground">
            Drag and drop an image here, or click to select
          </p>
          <p className="text-xs text-muted-foreground">
            Supports JPEG, PNG, GIF, BMP, WebP, HEIC, HEIF, TIFF (max 50MB)
          </p>
          {compressionEnabled && (
            <p className="text-xs text-green-600 dark:text-green-400">
              ⚡ Large images will be optimized automatically
            </p>
          )}
          
          {/* Manual browse button as fallback */}
          <div className="pt-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              disabled={isUploading || isProcessing}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Browse Files
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 