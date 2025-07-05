import { AuthButtons } from "./AuthButtons"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Zap, Shield, Upload, Loader2, Play } from "lucide-react"
import { signIn } from "next-auth/react"
import { useState, useCallback } from "react"

// Processing animation states
type ProcessingState = 'original' | 'processing' | 'processed'

function ProcessingShowcase() {
  const [state, setState] = useState<ProcessingState>('original')
  const [isAnimating, setIsAnimating] = useState(false)
  
  const startProcessing = useCallback(async () => {
    if (isAnimating) return
    
    setIsAnimating(true)
    setState('processing')
    
    // Simulate processing time
    setTimeout(() => {
      setState('processed')
      setIsAnimating(false)
    }, 2500)
  }, [isAnimating])
  
  const reset = useCallback(() => {
    if (isAnimating) return
    setState('original')
  }, [isAnimating])
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">Interactive Demo</h3>
        <p className="text-muted-foreground">Click the button to see AI background removal in action</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Before/Original Image */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground text-center">Before</div>
          <div className="aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center relative">
            <div 
              className={`absolute inset-0 transition-opacity duration-500 ${
                state === 'original' || state === 'processing' ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Image
                src="/supra.jpg"
                alt="Original car image with background"
                fill
                className="object-cover"
                unoptimized={true}
              />
              <div className="absolute inset-0 bg-black/20 flex items-end">
                <div className="p-3 text-white">
                  <p className="text-xs font-medium">Original</p>
                  <p className="text-xs opacity-90">With background</p>
                </div>
              </div>
            </div>
            <div 
              className={`absolute inset-0 transition-opacity duration-500 ${
                state === 'processed' ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center p-4">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">Original Image</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* After/Processed Image */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground text-center">After</div>
          <div className="aspect-square bg-transparent rounded-lg overflow-hidden flex items-center justify-center relative border-2 border-dashed border-primary/30">
            {/* Processing State */}
            <div 
              className={`absolute inset-0 transition-opacity duration-300 ${
                state === 'processing' ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-2" />
                  <p className="text-sm text-primary">Processing...</p>
                </div>
              </div>
            </div>
            
            {/* Processed State */}
            <div 
              className={`absolute inset-0 transition-opacity duration-500 ${
                state === 'processed' ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="flex items-center justify-center h-full">
                <Image
                  src="/supra-trans.png"
                  alt="Car with background removed"
                  fill
                  className="object-contain p-4"
                  unoptimized={true}
                />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="flex items-center justify-center space-x-2 bg-green-500/90 text-white text-xs font-medium px-2 py-1 rounded">
                    <Sparkles className="w-3 h-3" />
                    <span>Background Removed</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Default State */}
            <div 
              className={`absolute inset-0 transition-opacity duration-300 ${
                state === 'original' ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-4">
                  <Sparkles className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-sm text-primary">Background Removed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="flex justify-center space-x-3">
        {state === 'original' && (
          <Button
            onClick={startProcessing}
            disabled={isAnimating}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2"
          >
            <Play className="w-4 h-4 mr-2" />
            Remove Background
          </Button>
        )}
        
        {state === 'processed' && (
          <Button
            onClick={reset}
            variant="outline"
            className="px-6 py-2"
          >
            Try Again
          </Button>
        )}
      </div>

      {/* Status indicator */}
      <div className="text-center">
        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm transition-all duration-300 ${
          state === 'processing' 
            ? 'bg-primary/20 text-primary' 
            : state === 'processed'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
            : 'bg-muted text-muted-foreground'
        }`}>
          {state === 'original' && (
            <>
              <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
              <span>Ready to process</span>
            </>
          )}
          {state === 'processing' && (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Processing with RMBG-2.0...</span>
            </>
          )}
          {state === 'processed' && (
            <>
              <Sparkles className="w-3 h-3" />
              <span>Complete! Background removed</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Main Content - Centered */}
      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-6 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                {/* Logo and Title inline - Fixed alignment */}
                <div className="flex items-center justify-center lg:justify-start mb-6 flex-wrap">
                  <Image 
                    src="/rmbg.svg" 
                    alt="BG-Remover Logo" 
                    width={60} 
                    height={60} 
                    className="drop-shadow-lg mr-4 flex-shrink-0"
                  />
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                    Remove Backgrounds
                  </h1>
                </div>
                
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Transform your images with AI-powered background removal. 
                  Upload any photo and get professional results in seconds - 
                  perfect for product photography, portraits, and creative projects.
                </p>
              </div>

              {/* Feature Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-4 bg-card rounded-lg shadow-sm border border-border">
                  <Zap className="h-5 w-5 text-primary" />
                  <span className="text-foreground font-medium">Lightning Fast</span>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-card rounded-lg shadow-sm border border-border">
                  <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="text-foreground font-medium">Secure & Private</span>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-card rounded-lg shadow-sm border border-border">
                  <Upload className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-foreground font-medium">Easy Upload</span>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-card rounded-lg shadow-sm border border-border">
                  <Sparkles className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <span className="text-foreground font-medium">AI Powered</span>
                </div>
              </div>

              {/* CTA Section */}
              <div className="space-y-4">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg"
                  onClick={() => signIn('google')}
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-sm text-muted-foreground">
                  No credit card required • Process unlimited images
                </p>
              </div>
            </div>

            {/* Right Side - Interactive Processing Demo */}
            <div className="relative">
              <div className="bg-card rounded-2xl shadow-2xl p-8 border border-border">
                <ProcessingShowcase />
              </div>

              {/* Floating elements for visual appeal */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary/10 rounded-full opacity-50"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-purple-400/10 dark:bg-purple-600/20 rounded-full opacity-50"></div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 border-t border-border">
        <div className="text-center text-muted-foreground text-sm space-y-2">
          <p>Powered by RMBG-2.0 AI model from BRIA AI</p>
          <p>This is a free, open-source tool for educational and personal use only.</p>
          <p className="text-xs">Not licensed for commercial use. Please respect the model&apos;s terms of service.</p>
        </div>
      </footer>
    </div>
  )
}