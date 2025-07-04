import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileImage } from 'lucide-react';

interface ImageUploadProps {
  onUpload: (file: File, title?: string) => Promise<void>;
  isUploading: boolean;
}

export function ImageUpload({ onUpload, isUploading }: ImageUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadedFile(file);
      // Set default title from filename (without extension)
      const filename = file.name;
      const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
      setTitle(nameWithoutExt || filename);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp', '.heic', '.heif', '.tiff', '.tif']
    },
    maxFiles: 1,
    disabled: isUploading || isProcessing
  });

  const handleUpload = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    try {
      await onUpload(uploadedFile, title.trim() || undefined);
      // Reset form after successful upload
      setUploadedFile(null);
      setTitle('');
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setUploadedFile(null);
    setTitle('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && uploadedFile && !isUploading && !isProcessing) {
      handleUpload();
    }
  };

  if (uploadedFile) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-card rounded-lg border-2 border-dashed border-border p-6">
          <div className="flex items-center space-x-3 mb-4">
            <FileImage className="h-8 w-8 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {uploadedFile.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={handleCancel}
              className="text-muted-foreground hover:text-foreground"
              disabled={isUploading || isProcessing}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

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
                disabled={isUploading || isProcessing}
                className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading || isProcessing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isUploading ? 'Uploading...' : 'Processing...'}
                  </div>
                ) : (
                  'Upload Image'
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={isUploading || isProcessing}
                className="px-4 py-2 border border-border text-foreground rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
      <div
        {...getRootProps()}
        className={`bg-card rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-accent'
            : 'border-border hover:border-primary'
        } ${isUploading || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
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
        </div>
      </div>
    </div>
  );
} 