import React from 'react';
import { useProcessingProgress } from '@/lib/useImageManager';
import { Loader2, CheckCircle, AlertCircle, Zap } from 'lucide-react';

interface ProcessingProgressProps {
  imageId: string;
  onComplete?: () => void;
  onError?: () => void;
}

export function ProcessingProgress({ imageId, onComplete, onError }: ProcessingProgressProps) {
  const { progress, status } = useProcessingProgress(imageId);

  React.useEffect(() => {
    if (status === 'completed' && onComplete) {
      onComplete();
    } else if (status === 'error' && onError) {
      onError();
    }
  }, [status, onComplete, onError]);

  if (status === 'idle') {
    return null;
  }

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-card rounded-lg border border-border">
      <div className="flex items-center space-x-3 mb-3">
        {status === 'processing' && (
          <>
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
            <span className="text-sm font-medium text-foreground">Processing image...</span>
          </>
        )}
        {status === 'completed' && (
          <>
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              Background removed successfully!
            </span>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-sm font-medium text-red-600 dark:text-red-400">
              Processing failed. Please try again.
            </span>
          </>
        )}
      </div>

      {/* Progress bar */}
      {(status === 'processing' || status === 'starting') && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {progress < 20 ? 'Preparing image...' : 
               progress < 50 ? 'Analyzing content...' : 
               progress < 80 ? 'Removing background...' : 
               'Finalizing...'}
            </span>
            <span className="text-xs text-muted-foreground">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Processing tips */}
      {status === 'processing' && (
        <div className="mt-4 p-3 bg-accent rounded-lg">
          <div className="flex items-start space-x-2">
            <Zap className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Processing Tips:</p>
              <ul className="space-y-1 text-xs">
                <li>• Large images are automatically optimized for speed</li>
                <li>• Processing typically takes 10-30 seconds</li>
                <li>• Your image will be ready for download when complete</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 