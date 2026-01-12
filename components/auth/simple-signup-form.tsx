
'use client'

import { useState } from 'react'
import { signup } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Loader2, ArrowLeft } from 'lucide-react'

interface SimpleSignupFormProps {
    role: 'doctor' | 'pharmacist' | 'patient'
    title: string
    description: string
    extraFields?: React.ReactNode
}

export function SimpleSignupForm({ role, title, description, extraFields }: SimpleSignupFormProps) {
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)
        setSuccess(null)

        // Add the role to the form data manually since it's hardcoded for this page
        formData.append('role', role)

        try {
            const result = await signup(formData)
            if (result?.error) {
                setError(result.error)
            }
        } catch (e) {
            console.error("Signup error:", e)
            setError("An unexpected error occurred. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
                <CardHeader className="space-y-1">
                    <Link href="/signup" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-2 transition-colors">
                        <ArrowLeft className="h-3 w-3" /> Back to roles
                    </Link>
                    <CardTitle className="text-2xl font-bold tracking-tight">{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
                <form action={handleSubmit}>
                    <CardContent className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label htmlFor="full_name">Full Name</Label>
                            <Input id="full_name" name="full_name" placeholder="John Doe" required className="bg-white/50" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" name="email" type="email" placeholder="m@example.com" required className="bg-white/50" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Create Password</Label>
                            <Input id="password" name="password" type="password" required className="bg-white/50" />
                        </div>

                        {extraFields}

                        {error && (
                            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-3 rounded-md bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
                                {success}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button className="w-full font-semibold shadow-md active:scale-[0.98] transition-all" type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create {role.charAt(0).toUpperCase() + role.slice(1)} Account
                        </Button>
                        <div className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <Link href="/login" className="text-primary hover:underline font-semibold">
                                Sign in
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
