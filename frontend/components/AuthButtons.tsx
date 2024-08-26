'use client'

import { signIn, signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function AuthButtons() {
  const { data: session } = useSession()

  if (session) {
    return (
      <>
        Signed in as {session.user?.email} <br />
        <Button onClick={() => signOut()}>Sign out</Button>
      </>
    )
  }
  return (
    <>

      <Button onClick={() => signIn('google')}>Sign in with Google</Button>
     
    </>
  )
}