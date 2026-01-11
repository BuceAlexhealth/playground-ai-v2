
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Stethoscope, Pill, User } from 'lucide-react'
import { ModeToggle } from '@/components/mode-toggle'

const roles = [
    {
        title: 'I am a Doctor',
        description: 'Issue prescriptions and manage patient health digitally.',
        href: '/signup/doctor',
        icon: Stethoscope,
        color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50 h-10 w-10 flex items-center justify-center rounded-lg',
        hover: 'hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg'
    },
    {
        title: 'I am a Patient',
        description: 'Track your prescriptions and order from your favorite pharmacy.',
        href: '/signup/patient',
        icon: User,
        color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/50 h-10 w-10 flex items-center justify-center rounded-lg',
        hover: 'hover:border-green-300 dark:hover:border-green-700 hover:shadow-lg'
    },
    {
        title: 'I am a Pharmacist',
        description: 'Manage incoming orders and verify prescriptions in real-time.',
        href: '/signup/pharmacy',
        icon: Pill,
        color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/50 h-10 w-10 flex items-center justify-center rounded-lg',
        hover: 'hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-lg'
    }
]

export default function SignupHub() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors duration-300">
            <div className="absolute top-4 right-4">
                <ModeToggle />
            </div>
            <div className="max-w-4xl w-full">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-slate-50 sm:text-5xl mb-3">
                        Welcome to PHARMA<span className="text-purple-600">HUB</span>
                    </h1>
                    <p className="text-lg text-muted-foreground dark:text-slate-400 max-w-2xl mx-auto">
                        Choose your portal to get started with the platform designed for independence and transparency.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {roles.map((role) => (
                        <Link key={role.href} href={role.href} className="group">
                            <Card className={`h-full transition-all duration-300 ${role.hover} cursor-pointer border-2`}>
                                <CardHeader>
                                    <div className={role.color}>
                                        <role.icon className="h-6 w-6" />
                                    </div>
                                    <CardTitle className="text-xl mt-4 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors text-slate-900 dark:text-slate-50">{role.title}</CardTitle>
                                    <CardDescription className="leading-relaxed dark:text-slate-400">
                                        {role.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm font-semibold text-purple-600 dark:text-purple-400 inline-flex items-center group-hover:translate-x-1 transition-transform">
                                        Start registration &rarr;
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <p className="text-muted-foreground dark:text-slate-500">
                        Already registered? <Link href="/login" className="text-purple-600 dark:text-purple-400 font-bold hover:underline">Sign in to your account</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
