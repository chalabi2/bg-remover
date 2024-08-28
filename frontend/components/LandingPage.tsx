import { AuthButtons } from "./AuthButtons"
import Image from "next/image"

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground relative">
      <h1 className="text-4xl font-bold mb-6">Welcome to bg-remover</h1>
      <p className="text-xl mb-8">Remove backgrounds from your images with ease.</p>
      <AuthButtons />
      <div className="absolute bottom-0 right-0 z-0">
       
      </div>
    </div>
  )
}