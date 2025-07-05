import { AuthButtons } from "./AuthButtons"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Zap, Shield, Upload, Loader2 } from "lucide-react"
import { signIn } from "next-auth/react"
import { useState, useEffect } from "react"

// Processing animation states
type ProcessingState = 'original' | 'processing' | 'processed'

function ProcessingShowcase() {
  const [state, setState] = useState<ProcessingState>('original')
  
  useEffect(() => {
    const cycle = () => {
      setState('original')
      setTimeout(() => setState('processing'), 2000)
      setTimeout(() => setState('processed'), 4000)
      setTimeout(() => setState('original'), 6000)
    }
    
    // Start the cycle
    cycle()
    const interval = setInterval(cycle, 8000)
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">See the Magic</h3>
        <p className="text-muted-foreground">Watch as AI removes backgrounds in real-time</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Before/Original Image */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground text-center">Before</div>
          <div className="aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center relative">
            {state === 'original' || state === 'processing' ? (
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
                <div className="w-24 h-32 bg-orange-200 dark:bg-orange-800 rounded-lg flex items-center justify-center">
                  <div className="w-12 h-12 bg-orange-400 dark:bg-orange-600 rounded-full"></div>
                </div>
              </div>
            ) : (
              <div className="text-center p-4">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Your Image</p>
              </div>
            )}
          </div>
        </div>
        
        {/* After/Processed Image */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground text-center">After</div>
          <div className="aspect-square bg-transparent rounded-lg overflow-hidden flex items-center justify-center relative border-2 border-dashed border-primary/30">
            {state === 'processing' ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            ) : state === 'processed' ? (
              <div className="w-24 h-32 bg-transparent flex items-center justify-center">
                <div className="w-12 h-12 bg-orange-400 dark:bg-orange-600 rounded-full shadow-lg"></div>
              </div>
            ) : (
              <div className="text-center p-4">
                <Sparkles className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-primary">Background Removed</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status indicator */}
      <div className="text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
          {state === 'original' && (
            <>
              <div className="w-2 h-2 bg-primary rounded-full"></div>
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

            {/* Right Side - Animated Processing Demo */}
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
          <p className="text-xs">Not licensed for commercial use. Please respect the model's terms of service.</p>
        </div>
      </footer>
    </div>
  )
}