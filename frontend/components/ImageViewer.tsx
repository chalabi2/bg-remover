import React, { useState } from 'react';
import { ServerImage } from '@/lib/useImageManager';
import { X, Download, ArrowLeft, ArrowRight, Maximize2, Minimize2 } from 'lucide-react';
import Image from 'next/image';

interface ImageViewerProps {
  image: ServerImage | null;
  onClose: () => void;
  onDownload: (imageId: string) => Promise<void>;
  onUpdateTitle: (imageId: string, title: string) => Promise<void>;
}

export function ImageViewer({ image, onClose, onDownload, onUpdateTitle }: ImageViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');

  if (!image) return null;

  const handleEditTitle = () => {
    setEditingTitle(true);
    setEditTitle(image.title);
  };

  const handleSaveTitle = async () => {
    if (editTitle.trim()) {
      await onUpdateTitle(image.id, editTitle.trim());
    }
    setEditingTitle(false);
    setEditTitle('');
  };

  const handleCancelEdit = () => {
    setEditingTitle(false);
    setEditTitle('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleDownload = async () => {
    if (image.processed) {
      await onDownload(image.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className={`bg-background rounded-lg shadow-xl max-w-6xl w-full max-h-full overflow-hidden ${
        isFullscreen ? 'fixed inset-4' : ''
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex-1">
              {editingTitle ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyPress={handleKeyPress}
                    onBlur={handleSaveTitle}
                    className="text-lg font-semibold text-foreground border border-border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-semibold text-foreground">
                    {image.title}
                  </h2>
                  <button
                    onClick={handleEditTitle}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {image.processed && (
              <button
                onClick={handleDownload}
                className="bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center space-x-1"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>
            )}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-muted-foreground hover:text-foreground"
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Image comparison */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Original image */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-foreground text-center">
                Original Image
              </h3>
              <div className="relative bg-muted rounded-lg overflow-hidden">
                <Image
                  src={`/api/images/${image.id}/original`}
                  alt={`Original: ${image.title}`}
                  className="w-full h-auto object-contain"
                  width={100}
                  height={100}
                  unoptimized={true}
                />
              </div>
              <div className="text-center text-sm text-muted-foreground">
                <p>Uploaded: {new Date(image.upload_time).toLocaleString()}</p>
                <p>Status: {image.status}</p>
              </div>
            </div>

            {/* Processed image */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-foreground text-center">
                Processed Image
              </h3>
              <div className="relative bg-muted rounded-lg overflow-hidden">
                {image.processed ? (
                  <Image
                    src={`/api/images/${image.id}/processed`}
                    alt={`Processed: ${image.title}`}
                    className="w-full h-auto object-contain"
                    width={100}
                    height={100}
                    unoptimized={true}
                  />
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📷</div>
                      <p>Not processed yet</p>
                      <p className="text-sm">Click &quot;Process&quot; to remove background</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="text-center text-sm text-muted-foreground">
                {image.processed ? (
                  <>
                    <p>Background removed successfully</p>
                    <p>Format: PNG with transparency</p>
                  </>
                ) : (
                  <p>Ready for processing</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              <p>Image ID: {image.id}</p>
              <p>Original filename: {image.original_filename}</p>
            </div>
            <div className="text-right">
              <p>Status: {image.status}</p>
              {image.processed && (
                <p>Processed: {new Date(image.upload_time).toLocaleString()}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 