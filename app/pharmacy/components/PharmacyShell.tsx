
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Pill, Package, Receipt, Users } from 'lucide-react'
import PatientView from './PatientView'
import InventoryView from './InventoryView'
import BillingView from './BillingView'
import { ConnectPatientModal } from './ConnectPatientModal'
import { ModeToggle } from '@/components/mode-toggle'

export default function PharmacyShell({
    orders,
    inventory,
    bills,
    profile,
    connectedPatients
}: {
    orders: any[],
    inventory: any[],
    bills: any[],
    profile: any,
    connectedPatients: any[]
}) {
    const [view, setView] = useState<'orders' | 'inventory' | 'billing'>('orders')

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            {/* Header */}
            <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-600 p-2 rounded-xl shadow-md shadow-purple-100 dark:shadow-purple-900/20">
                            <Pill className="text-white h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-slate-900 dark:text-slate-50 leading-none tracking-tight">PHARMA<span className="text-purple-600">HUB</span></h1>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                                {profile?.pharmacy_name || 'Pharmacist Terminal'}
                            </p>
                        </div>
                    </div>

                    <nav className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <Button
                            variant={view === 'orders' ? 'default' : 'ghost'}
                            size="sm"
                            className={`rounded-lg h-9 px-4 transition-all ${view === 'orders' ? 'bg-white dark:bg-slate-900 text-purple-600 shadow-sm hover:bg-white dark:hover:bg-slate-900' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'}`}
                            onClick={() => setView('orders')}
                        >
                            <Users className="h-4 w-4 mr-2" /> Patients
                        </Button>
                        <Button
                            variant={view === 'inventory' ? 'default' : 'ghost'}
                            size="sm"
                            className={`rounded-lg h-9 px-4 transition-all ${view === 'inventory' ? 'bg-white dark:bg-slate-900 text-purple-600 shadow-sm hover:bg-white dark:hover:bg-slate-900' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'}`}
                            onClick={() => setView('inventory')}
                        >
                            <Package className="h-4 w-4 mr-2" /> Stock
                        </Button>
                        <Button
                            variant={view === 'billing' ? 'default' : 'ghost'}
                            size="sm"
                            className={`rounded-lg h-9 px-4 transition-all ${view === 'billing' ? 'bg-white dark:bg-slate-900 text-purple-600 shadow-sm hover:bg-white dark:hover:bg-slate-900' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'}`}
                            onClick={() => setView('billing')}
                        >
                            <Receipt className="h-4 w-4 mr-2" /> Bills
                        </Button>
                    </nav>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col items-end mr-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-50">Dr. Pharmacist</span>
                            <span className="text-[10px] text-green-600 dark:text-green-500 font-bold uppercase">Online Now</span>
                        </div>
                        <ModeToggle />
                        <ConnectPatientModal pharmacyName={profile?.pharmacy_name} pharmacyId={profile?.id} />
                        <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"></div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-[1600px] mx-auto w-full p-6 flex-1 flex flex-col min-h-0">
                {view === 'orders' && <PatientView orders={orders} connectedPatients={connectedPatients} />}
                {view === 'inventory' && <InventoryView inventory={inventory} />}
                {view === 'billing' && <BillingView bills={bills} />}
            </main>
        </div>
    )
}
