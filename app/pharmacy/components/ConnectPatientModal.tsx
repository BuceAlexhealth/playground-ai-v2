'use client'

import { useState } from 'react'
import QRCode from 'react-qr-code'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Copy, QrCode } from 'lucide-react'

export function ConnectPatientModal({ pharmacyId }: { pharmacyName: string, pharmacyId: string }) {
    const [open, setOpen] = useState(false)
    const [copied, setCopied] = useState(false)

    // Use window.location.origin only on client side
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const inviteLink = `${origin}/connect?pharmacy_id=${pharmacyId}`

    const copyLink = () => {
        navigator.clipboard.writeText(inviteLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                    <QrCode className="h-4 w-4" />
                    Connect Patient
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md dark:bg-slate-900 dark:border-slate-800">
                <DialogHeader>
                    <DialogTitle className="dark:text-slate-50">Connect New Patient</DialogTitle>
                    <DialogDescription className="dark:text-slate-400">
                        Share this QR code or link with your patient to connect them to your pharmacy.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center p-6 space-y-6">
                    <div className="bg-white p-4 rounded-xl shadow-inner border border-slate-100 dark:border-slate-800">
                        <QRCode value={inviteLink} size={200} />
                    </div>

                    <div className="flex items-center space-x-2 w-full">
                        <div className="grid flex-1 gap-2">
                            <div className="flex h-10 w-full rounded-md border border-input bg-background dark:bg-slate-950 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-slate-500 dark:text-slate-400 overflow-hidden text-ellipsis whitespace-nowrap">
                                {inviteLink}
                            </div>
                        </div>
                        <Button type="button" size="icon" onClick={copyLink} className={copied ? "bg-green-600 hover:bg-green-700" : "bg-purple-600 hover:bg-purple-700 dark:shadow-none"}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                    {copied && <p className="text-xs text-green-600 dark:text-green-400 font-bold">Link copied to clipboard!</p>}
                </div>
            </DialogContent>
        </Dialog>
    )
}
