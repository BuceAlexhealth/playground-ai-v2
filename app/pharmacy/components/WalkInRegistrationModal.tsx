'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserPlus, User } from 'lucide-react'
import { registerWalkInPatient } from '../actions'

interface WalkInRegistrationModalProps {
    isOpen: boolean
    onClose: () => void
    onPatientRegistered: (patientId: string) => void
}

export function WalkInRegistrationModal({ isOpen, onClose, onPatientRegistered }: WalkInRegistrationModalProps) {
    const [fullName, setFullName] = useState('')
    const [phone, setPhone] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleRegister = async () => {
        if (!fullName || !phone) return
        setIsLoading(true)
        try {
            const res = await registerWalkInPatient(fullName, phone)
            if (res.success && res.patientId) {
                onPatientRegistered(res.patientId)
                // Reset form
                setFullName('')
                setPhone('')
                onClose()
            } else {
                alert(res.error || 'Failed to register patient')
            }
        } catch (e) {
            console.error(e)
            alert('An unexpected error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-white dark:bg-slate-900 rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="bg-blue-600 p-6 text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <UserPlus className="h-6 w-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black">Walk-in Patient</DialogTitle>
                            <p className="text-blue-100 dark:text-blue-200 text-xs font-medium">Quick registration for billing</p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Full Name</label>
                            <Input
                                placeholder="e.g. John Doe"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 rounded-xl font-medium dark:text-slate-100 h-12"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Phone Number</label>
                            <Input
                                placeholder="e.g. 555-0123"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 rounded-xl font-medium dark:text-slate-100 h-12"
                            />
                        </div>
                    </div>

                    <Button
                        onClick={handleRegister}
                        disabled={!fullName || !phone || isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-6 font-black text-lg shadow-xl shadow-blue-100 dark:shadow-none transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isLoading ? 'Registering...' : 'Start Session'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
