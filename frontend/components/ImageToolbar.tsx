import React from 'react';
import { 
  Play, 
  Download, 
  CheckSquare, 
  Square, 
  Trash2,
  RefreshCw
} from 'lucide-react';

interface ImageToolbarProps {
  totalImages: number;
  selectedCount: number;
  processedCount: number;
  isProcessing: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onProcessSelected: () => Promise<void>;
  onDownloadSelected: () => Promise<void>;
  onDeleteSelected: () => Promise<void>;
  onRefresh: () => void;
}

export function ImageToolbar({
  totalImages,
  selectedCount,
  processedCount,
  isProcessing,
  onSelectAll,
  onDeselectAll,
  onProcessSelected,
  onDownloadSelected,
  onDeleteSelected,
  onRefresh
}: ImageToolbarProps) {
  const isAllSelected = selectedCount === totalImages && totalImages > 0;
  const hasSelected = selectedCount > 0;
  const hasProcessedSelected = selectedCount > 0; // We'll need to check if selected images are processed

  return (
    <div className="bg-card border-b border-border px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - Selection and counts */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={isAllSelected ? onDeselectAll : onSelectAll}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
            >
              {isAllSelected ? (
                <CheckSquare className="h-5 w-5" />
              ) : (
                <Square className="h-5 w-5" />
              )}
              <span className="text-sm font-medium">
                {isAllSelected ? 'Deselect All' : 'Select All'}
              </span>
            </button>
          </div>

          <div className="text-sm text-muted-foreground">
            {hasSelected ? (
              <span>{selectedCount} of {totalImages} selected</span>
            ) : (
              <span>{totalImages} image{totalImages !== 1 ? 's' : ''}</span>
            )}
          </div>

          {processedCount > 0 && (
            <div className="text-sm text-green-600">
              {processedCount} processed
            </div>
          )}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onRefresh}
            className="text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-muted"
            title="Refresh images"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {hasSelected && (
            <>
              <button
                onClick={onProcessSelected}
                disabled={isProcessing}
                className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3" />
                    <span>Process Selected</span>
                  </>
                )}
              </button>

              <button
                onClick={onDownloadSelected}
                className="bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center space-x-1"
              >
                <Download className="h-3 w-3" />
                <span>Download Selected</span>
              </button>

              <button
                onClick={onDeleteSelected}
                className="bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center space-x-1"
              >
                <Trash2 className="h-3 w-3" />
                <span>Delete Selected</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 