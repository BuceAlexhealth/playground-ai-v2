
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default async function Home() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch Profile Role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // Handle edge case where auth user exists but profile doesn't (shouldn't happen with trigger)
    // Maybe redirect to an onboarding or error page.
    // For now, redirect to login which might just loop if we aren't careful, 
    // so let's just show an error.
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-600">Profile Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            Please contact support. Your user account exists but has no profile data.
          </CardContent>
        </Card>
      </div>
    )
  }

  // Redirect based on role
  if (profile.role === 'doctor') {
    redirect('/doctor')
  } else if (profile.role === 'pharmacist') {
    redirect('/pharmacy')
  } else {
    redirect('/patient')
  }

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
