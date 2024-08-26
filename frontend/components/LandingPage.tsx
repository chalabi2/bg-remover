import { AuthButtons } from "./AuthButtons"
import { Button } from "./ui/button"

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <h1 className="text-4xl font-bold mb-6">Welcome to bg-remover</h1>
      <p className="text-xl mb-8">Remove backgrounds from your images with ease.</p>
      <AuthButtons />
    </div>
  )
}