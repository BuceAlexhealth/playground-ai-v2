
import { signout } from '../auth/actions'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/mode-toggle'

export default function DoctorDashboard() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 transition-colors duration-300">
            <div className="flex items-center justify-between mb-8 max-w-7xl mx-auto">
                <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Doctor Console</h1>
                <div className="flex items-center gap-4">
                    <ModeToggle />
                    <form action={signout}>
                        <Button variant="outline" className="dark:border-slate-800 dark:text-slate-400">Sign Out</Button>
                    </form>
                </div>
            </div>
            <div className="grid gap-6 max-w-7xl mx-auto">
                <div className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
                    <h2 className="text-xl font-bold mb-2 text-slate-900 dark:text-slate-100 uppercase tracking-widest text-[10px]">My Patients</h2>
                    <p className="text-slate-500 dark:text-slate-400">No patients yet.</p>
                </div>
                <div className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
                    <h2 className="text-xl font-bold mb-2 text-slate-900 dark:text-slate-100 uppercase tracking-widest text-[10px]">Recent Prescriptions</h2>
                    <p className="text-slate-500 dark:text-slate-400">No prescriptions yet.</p>
                </div>
            </div>
        </div>
    )
}
