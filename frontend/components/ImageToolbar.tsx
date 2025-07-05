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
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        {/* Left side - Selection and counts */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={isAllSelected ? onDeselectAll : onSelectAll}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
            >
              {isAllSelected ? (
                <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Square className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
              <span className="text-xs sm:text-sm font-medium">
                {isAllSelected ? 'Deselect All' : 'Select All'}
              </span>
            </button>
          </div>

          <div className="text-xs sm:text-sm text-muted-foreground">
            {hasSelected ? (
              <span className="hidden sm:inline">{selectedCount} of {totalImages} selected</span>
            ) : (
              <span>{totalImages} image{totalImages !== 1 ? 's' : ''}</span>
            )}
            {hasSelected && (
              <span className="sm:hidden">{selectedCount} selected</span>
            )}
          </div>

          {processedCount > 0 && (
            <div className="text-xs sm:text-sm text-green-600">
              <span className="hidden sm:inline">{processedCount} processed</span>
              <span className="sm:hidden">{processedCount} done</span>
            </div>
          )}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-2 overflow-x-auto">
          <button
            onClick={onRefresh}
            className="text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-muted flex-shrink-0"
            title="Refresh images"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {hasSelected && (
            <>
              <button
                onClick={onProcessSelected}
                disabled={isProcessing}
                className="bg-primary text-primary-foreground px-2 sm:px-3 py-1.5 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 flex-shrink-0"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    <span className="hidden sm:inline">Processing...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3" />
                    <span className="hidden sm:inline">Process Selected</span>
                    <span className="sm:hidden">Process</span>
                  </>
                )}
              </button>

              <button
                onClick={onDownloadSelected}
                className="bg-green-600 text-white px-2 sm:px-3 py-1.5 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center space-x-1 flex-shrink-0"
              >
                <Download className="h-3 w-3" />
                <span className="hidden sm:inline">Download Selected</span>
                <span className="sm:hidden">Download</span>
              </button>

              <button
                onClick={onDeleteSelected}
                className="bg-red-600 text-white px-2 sm:px-3 py-1.5 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center space-x-1 flex-shrink-0"
              >
                <Trash2 className="h-3 w-3" />
                <span className="hidden sm:inline">Delete Selected</span>
                <span className="sm:hidden">Delete</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 