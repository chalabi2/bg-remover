import React, { useState } from 'react';
import { ServerImage } from '@/lib/useImageManager';
import { 
  Download, 
  Play, 
  Check, 
  X, 
  Edit3, 
  Eye,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface ImageGridProps {
  images: ServerImage[];
  selectedImages: Set<string>;
  onSelectImage: (imageId: string) => void;
  onDeselectImage: (imageId: string) => void;
  onProcessImage: (imageId: string) => Promise<void>;
  onDownloadImage: (imageId: string) => Promise<void>;
  onUpdateTitle: (imageId: string, title: string) => Promise<void>;
  onViewImage: (image: ServerImage) => void;
}

export function ImageGrid({
  images,
  selectedImages,
  onSelectImage,
  onDeselectImage,
  onProcessImage,
  onDownloadImage,
  onUpdateTitle,
  onViewImage
}: ImageGridProps) {
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

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
        <div className="text-gray-400 mb-4">
          <Eye className="h-12 w-12 mx-auto" />
        </div>
        <p className="text-lg font-medium text-gray-900 mb-2">No images yet</p>
        <p className="text-gray-500">Upload your first image to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {images.map((image) => {
        const isSelected = selectedImages.has(image.id);
        const isEditing = editingTitle === image.id;

        return (
          <div
            key={image.id}
            className={`relative bg-white rounded-lg border-2 overflow-hidden transition-all duration-200 hover:shadow-lg ${
              isSelected 
                ? 'border-blue-500 shadow-md' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Selection checkbox */}
            <div className="absolute top-2 left-2 z-10">
              <button
                onClick={() => isSelected ? onDeselectImage(image.id) : onSelectImage(image.id)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  isSelected
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white border-gray-300 hover:border-blue-400'
                }`}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </button>
            </div>

            {/* Status indicator */}
            <div className="absolute top-2 right-2 z-10">
              <div className="flex items-center space-x-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
                {getStatusIcon(image)}
                <span className="text-xs font-medium text-gray-700">
                  {getStatusText(image)}
                </span>
              </div>
            </div>

            {/* Image preview */}
            <div 
              className="relative aspect-square bg-gray-100 cursor-pointer group"
              onClick={() => onViewImage(image)}
            >
              <img
                src={`/api/images/${image.id}/original`}
                alt={image.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              
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
                      className="flex-1 text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <h3 className="text-sm font-medium text-gray-900 truncate flex-1">
                      {image.title}
                    </h3>
                    <button
                      onClick={() => handleEditTitle(image)}
                      className="text-gray-400 hover:text-gray-600 ml-1"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Upload time */}
              <p className="text-xs text-gray-500 mb-3">
                {new Date(image.upload_time).toLocaleDateString()}
              </p>

              {/* Action buttons */}
              <div className="flex space-x-2">
                {!image.processed ? (
                  <button
                    onClick={() => onProcessImage(image.id)}
                    disabled={image.status === 'processing'}
                    className="flex-1 bg-blue-600 text-white text-xs px-3 py-1.5 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1"
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
                    className="flex-1 bg-green-600 text-white text-xs px-3 py-1.5 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 flex items-center justify-center space-x-1"
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