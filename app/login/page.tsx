
'use client'

import { useState } from 'react'
import { login } from '../auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { ModeToggle } from '@/components/mode-toggle'

export default function LoginPage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)
        const result = await login(formData)
        if (result?.error) {
            setError(result.error)
            setLoading(false)
        }
        // If successful, the action redirects, so we don't need to unset loading
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-950 p-4 transition-colors duration-300">
            <div className="absolute top-4 right-4">
                <ModeToggle />
            </div>
            <Card className="w-full max-w-md border-slate-200 dark:border-slate-800 shadow-xl">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Sign in to PHARMA<span className="text-purple-600">HUB</span></CardTitle>
                    <CardDescription className="dark:text-slate-400">
                        Enter your email and password to access your terminal.
                    </CardDescription>
                </CardHeader>
                <form action={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="dark:text-slate-300">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="m@example.com" required className="dark:bg-slate-900 dark:border-slate-800" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="dark:text-slate-300">Password</Label>
                            <Input id="password" name="password" type="password" required className="dark:bg-slate-900 dark:border-slate-800" />
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-100 dark:shadow-none" type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sign In
                        </Button>
                        <div className="text-center text-sm text-gray-500 dark:text-slate-400">
                            Don&apos;t have an account?{' '}
                            <Link href="/signup" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">
                                Sign up
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
