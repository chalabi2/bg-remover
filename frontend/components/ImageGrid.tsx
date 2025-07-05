import React, { useState } from 'react';
import { ServerImage, useProcessingProgress } from '@/lib/useImageManager';
import { 
  Download, 
  Play, 
  Check, 
  X, 
  Edit3, 
  Eye,
  Clock,
  AlertCircle,
  CheckCircle,
  Trash2,
  Loader2
} from 'lucide-react';
import Image from 'next/image';

interface ImageGridProps {
  images: ServerImage[];
  selectedImages: Set<string>;
  onSelectImage: (imageId: string) => void;
  onDeselectImage: (imageId: string) => void;
  onProcessImage: (imageId: string) => Promise<void>;
  onDownloadImage: (imageId: string) => Promise<void>;
  onUpdateTitle: (imageId: string, title: string) => Promise<void>;
  onDeleteImage: (imageId: string) => Promise<void>;
  onViewImage: (image: ServerImage) => void;
}

// Component for processing images with real-time progress
function ProcessingImageCard({ 
  image, 
  isSelected, 
  onSelect, 
  onDeselect, 
  onViewImage, 
  onEditTitle, 
  onDeleteImage, 
  isDeleting 
}: { 
  image: ServerImage; 
  isSelected: boolean; 
  onSelect: () => void; 
  onDeselect: () => void; 
  onViewImage: () => void; 
  onEditTitle: () => void; 
  onDeleteImage: () => void; 
  isDeleting: boolean; 
}) {
  const { progress, status } = useProcessingProgress(image.status === 'processing' ? image.id : null);

  return (
    <div
      className={`relative bg-card rounded-lg border-2 overflow-hidden transition-all duration-200 hover:shadow-lg ${
        isSelected 
          ? 'border-primary shadow-md' 
          : 'border-border hover:border-primary'
      }`}
    >
      {/* Selection checkbox */}
      <div className="absolute top-2 left-2 z-10">
        <button
          onClick={isSelected ? onDeselect : onSelect}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            isSelected
              ? 'bg-primary border-primary text-primary-foreground'
              : 'bg-background border-border hover:border-primary'
          }`}
        >
          {isSelected && <Check className="h-3 w-3" />}
        </button>
      </div>

      {/* Delete button */}
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={onDeleteImage}
          disabled={isDeleting}
          className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Delete image"
        >
          {isDeleting ? (
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
          ) : (
            <Trash2 className="h-3 w-3" />
          )}
        </button>
      </div>

      {/* Image preview */}
      <div 
        className="relative aspect-square bg-muted cursor-pointer group"
        onClick={onViewImage}
      >
        <Image
          src={image.processed ? `/api/images/${image.id}/processed` : `/api/images/${image.id}/original`}
          alt={image.processed ? `${image.title} (processed)` : image.title}
          className="w-full h-full object-cover"
          loading="lazy"
          width={400}
          height={400}
          unoptimized={true}
        />

        {/* Processing overlay with real-time progress */}
        {image.status === 'processing' && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white">
            <div className="text-center space-y-3 p-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Processing with AI...</p>
                <p className="text-xs opacity-75">
                  {progress < 20 ? 'Preparing image...' : 
                   progress < 50 ? 'Analyzing content...' : 
                   progress < 80 ? 'Removing background...' : 
                   'Finalizing...'}
                </p>
                
                {/* Progress bar */}
                <div className="w-32 bg-white/20 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-400 to-purple-400 h-1.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                
                <p className="text-xs opacity-75">
                  {Math.round(progress)}% complete
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Processed indicator */}
        {image.processed && (
          <div className="absolute bottom-2 left-2 z-10">
            <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
              <CheckCircle className="h-3 w-3" />
              <span>Processed</span>
            </div>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Eye className="h-8 w-8 text-white" />
          </div>
        </div>
      </div>

      {/* Image info */}
      <div className="p-3">
        {/* Title */}
        <div className="mb-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground truncate flex-1">
              {image.title}
            </h3>
            <button
              onClick={onEditTitle}
              className="text-muted-foreground hover:text-foreground ml-1"
            >
              <Edit3 className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Upload time */}
        <p className="text-xs text-muted-foreground mb-3">
          {new Date(image.upload_time).toLocaleDateString()}
        </p>

        {/* Status info for processing */}
        {image.status === 'processing' && (
          <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-center">
            <div className="flex items-center justify-center space-x-1 text-blue-600 dark:text-blue-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-xs font-medium">Processing...</span>
            </div>
            <p className="text-xs text-blue-500 dark:text-blue-300 mt-1">
              {Math.round(progress)}% complete
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function ImageGrid({
  images,
  selectedImages,
  onSelectImage,
  onDeselectImage,
  onProcessImage,
  onDownloadImage,
  onUpdateTitle,
  onDeleteImage,
  onViewImage
}: ImageGridProps) {
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingImage, setDeletingImage] = useState<string | null>(null);

  const handleEditTitle = (image: ServerImage) => {
    setEditingTitle(image.id);
    setEditTitle(image.title);
  };

  const handleSaveTitle = async (imageId: string) => {
    if (editTitle.trim()) {
      await onUpdateTitle(imageId, editTitle.trim());
    }
    setEditingTitle(null);
    setEditTitle('');
  };

  const handleCancelEdit = () => {
    setEditingTitle(null);
    setEditTitle('');
  };

  const handleKeyPress = (e: React.KeyboardEvent, imageId: string) => {
    if (e.key === 'Enter') {
      handleSaveTitle(imageId);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    setDeletingImage(imageId);
    try {
      await onDeleteImage(imageId);
    } finally {
      setDeletingImage(null);
    }
  };

  const getStatusIcon = (image: ServerImage) => {
    switch (image.status) {
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (image: ServerImage) => {
    switch (image.status) {
      case 'processing':
        return 'Processing...';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Error';
      default:
        return 'Ready';
    }
  };

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground mb-4">
          <Eye className="h-12 w-12 mx-auto" />
        </div>
        <p className="text-lg font-medium text-foreground mb-2">No images yet</p>
        <p className="text-muted-foreground">Upload your first image to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {images.map((image) => {
        const isSelected = selectedImages.has(image.id);
        const isEditing = editingTitle === image.id;
        const isDeleting = deletingImage === image.id;

        // Use special ProcessingImageCard for processing images
        if ((image.status as any) === 'processing') {
          return (
            <ProcessingImageCard
              key={image.id}
              image={image}
              isSelected={isSelected}
              onSelect={() => onSelectImage(image.id)}
              onDeselect={() => onDeselectImage(image.id)}
              onViewImage={() => onViewImage(image)}
              onEditTitle={() => handleEditTitle(image)}
              onDeleteImage={() => handleDeleteImage(image.id)}
              isDeleting={isDeleting}
            />
          );
        }

        // Regular card for non-processing images
        return (
          <div
            key={image.id}
            className={`relative bg-card rounded-lg border-2 overflow-hidden transition-all duration-200 hover:shadow-lg ${
              isSelected 
                ? 'border-primary shadow-md' 
                : 'border-border hover:border-primary'
            }`}
          >
            {/* Selection checkbox */}
            <div className="absolute top-2 left-2 z-10">
              <button
                onClick={() => isSelected ? onDeselectImage(image.id) : onSelectImage(image.id)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  isSelected
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-background border-border hover:border-primary'
                }`}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </button>
            </div>

            {/* Delete button */}
            <div className="absolute top-2 right-2 z-10">
              <button
                onClick={() => handleDeleteImage(image.id)}
                disabled={isDeleting}
                className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete image"
              >
                {isDeleting ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </button>
            </div>

            {/* Status indicator */}
            <div className="absolute top-2 right-12 z-10">
              <div className="flex items-center space-x-1 bg-card/90 backdrop-blur-sm rounded-full px-2 py-1">
                {getStatusIcon(image)}
                <span className="text-xs font-medium text-muted-foreground">
                  {getStatusText(image)}
                </span>
              </div>
            </div>

            {/* Image preview */}
            <div 
              className="relative aspect-square bg-muted cursor-pointer group"
              onClick={() => onViewImage(image)}
            >
              <Image
                src={image.processed ? `/api/images/${image.id}/processed` : `/api/images/${image.id}/original`}
                alt={image.processed ? `${image.title} (processed)` : image.title}
                className="w-full h-full object-cover"
                loading="lazy"
                width={400}
                height={400}
                unoptimized={true}
              />

              {/* Processed indicator */}
              {image.processed && (
                <div className="absolute bottom-2 left-2 z-10">
                  <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>Processed</span>
                  </div>
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>

            {/* Image info */}
            <div className="p-3">
              {/* Title */}
              <div className="mb-2">
                {isEditing ? (
                  <div className="flex items-center space-x-1">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, image.id)}
                      onBlur={() => handleSaveTitle(image.id)}
                      className="flex-1 text-sm font-medium text-foreground border border-border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveTitle(image.id)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-foreground truncate flex-1">
                      {image.title}
                    </h3>
                    <button
                      onClick={() => handleEditTitle(image)}
                      className="text-muted-foreground hover:text-foreground ml-1"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Upload time */}
              <p className="text-xs text-muted-foreground mb-3">
                {new Date(image.upload_time).toLocaleDateString()}
              </p>

              {/* Action buttons */}
              <div className="flex space-x-2">
                {!image.processed ? (
                  <button
                    onClick={() => onProcessImage(image.id)}
                    disabled={image.status === 'processing'}
                    className="flex-1 bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1"
                  >
                    {image.status === 'processing' ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3" />
                        <span>Process</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => onDownloadImage(image.id)}
                    className="flex-1 bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 flex items-center justify-center space-x-1"
                  >
                    <Download className="h-3 w-3" />
                    <span>Download</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
} 