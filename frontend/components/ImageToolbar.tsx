import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Trash2, RefreshCw, CheckSquare, Square } from 'lucide-react';
import { ImageFile } from '@/lib/useImageManager';

interface ImageToolbarProps {
  images: ImageFile[];
  selectedCount: number;
  processedCount: number;
  unprocessedCount: number;
  isProcessing: boolean;
  onProcessAll: () => void;
  onProcessSelected: () => void;
  onDownloadAll: () => void;
  onDownloadSelected: () => void;
  onDeleteAll: () => void;
  onDeleteSelected: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onClearErrors: () => void;
}

export function ImageToolbar({
  images,
  selectedCount,
  processedCount,
  unprocessedCount,
  isProcessing,
  onProcessAll,
  onProcessSelected,
  onDownloadAll,
  onDownloadSelected,
  onDeleteAll,
  onDeleteSelected,
  onSelectAll,
  onDeselectAll,
  onClearErrors,
}: ImageToolbarProps) {
  const hasErrors = images.some(img => img.status === 'error');
  const selectedProcessedCount = images.filter(img => img.isSelected && img.processed).length;

  return (
    <div className="mb-4 flex flex-wrap gap-2 bg-muted/50 p-4 rounded-lg min-h-20 items-center justify-start">
      {selectedCount === 0 ? (
        <>
          <Button 
            onClick={onProcessAll}
            disabled={isProcessing || unprocessedCount === 0}
          >
            {isProcessing ? 'Processing...' : `Process All (${unprocessedCount})`}
          </Button>
          
          {processedCount > 0 && (
            <Button onClick={onDownloadAll} variant="secondary">
              <Download className="h-4 w-4 mr-2" />
              Download All ({processedCount})
            </Button>
          )}
          
          <Button onClick={onSelectAll} variant="outline">
            <CheckSquare className="h-4 w-4 mr-2" />
            Select All
          </Button>
          
          {hasErrors && (
            <Button onClick={onClearErrors} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear Errors
            </Button>
          )}
          
          <Button onClick={onDeleteAll} variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete All
          </Button>
        </>
      ) : (
        <>
          <Button 
            onClick={onProcessSelected}
            disabled={isProcessing || images.every(img => img.processed)}
          >
            {isProcessing ? 'Processing...' : `Process Selected (${selectedCount})`}
          </Button>
          
          {selectedProcessedCount > 0 && (
            <Button onClick={onDownloadSelected} variant="secondary">
              <Download className="h-4 w-4 mr-2" />
              Download Selected ({selectedProcessedCount})
            </Button>
          )}
          
          <Button onClick={onDeselectAll} variant="outline">
            <Square className="h-4 w-4 mr-2" />
            Deselect All
          </Button>
          
          <Button onClick={onDeleteSelected} variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected ({selectedCount})
          </Button>
        </>
      )}
    </div>
  );
} 