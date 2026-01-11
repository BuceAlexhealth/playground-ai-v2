'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { sendMessage, getMessages, payBill } from '../../pharmacy/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { User, Pill, Clock, Receipt, Send, Image as ImageIcon, Paperclip, Smile, CreditCard } from 'lucide-react'

export function PatientChatView({
    connectedPharmacies,
    prescriptions,
    bills
}: {
    connectedPharmacies: any[],
    prescriptions: any[],
    bills: any[]
}) {
    const [selectedPharmacyId, setSelectedPharmacyId] = useState<string | null>(connectedPharmacies[0]?.pharmacy_id || null)
    const [message, setMessage] = useState('')

    const activePharmacy = connectedPharmacies.find(c => c.pharmacy_id === selectedPharmacyId)?.pharmacy
    const activeBills = bills.filter(b => b.pharmacy_id === selectedPharmacyId)
    const activePrescriptions = prescriptions.filter(p => true) // Prescriptions might not be pharmacy-linked yet based on schema

    const [chatHistory, setChatHistory] = useState<any[]>([])

    const supabase = createClient()

    useEffect(() => {
        if (!selectedPharmacyId) return

        const fetchMessages = async () => {
            const msgs = await getMessages(selectedPharmacyId)
            setChatHistory(msgs)
        }
        fetchMessages()

        const channel = supabase
            .channel('patient_chat')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages'
            }, (payload) => {
                const newMessage = payload.new
                if (newMessage.sender_id === selectedPharmacyId || newMessage.receiver_id === selectedPharmacyId) {
                    setChatHistory(prev => [...prev.filter(m => m.id !== newMessage.id), newMessage])
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [selectedPharmacyId, supabase])

    const handleSendMessage = async () => {
        if (!message.trim() || !selectedPharmacyId) return
        const res = await sendMessage(selectedPharmacyId, message)
        if (res.success) {
            setMessage('')
        }
    }

    const handlePayBill = async (billId: string) => {
        if (!billId) return
        // Optimistic update or just wait for revalidate
        // Since we didn't implement optimistic update for history properly without complex state, we'll rely on server action revalidation + local state hacking if needed.
        // But revalidatePath('/patient') in the action should trigger a refresh of the page props if this was a server component.
        // This is a client component. It won't auto-refresh `chatHistory` unless we trigger `fetchMessages`.
        // We can manually trigger fetchMessages or add a system message locally.

        try {
            const res = await payBill(billId)
            if (res.success) {
                // Refresh messages
                const msgs = await getMessages(selectedPharmacyId!)
                setChatHistory(msgs)
            } else {
                alert('Payment failed: ' + res.error)
            }
        } catch (error) {
            console.error(error)
            alert('Payment error')
        }
    }

    return (
        <div className="flex h-[calc(100vh-14rem)] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl">
            {/* Left Sidebar - Pharmacy List */}
            <div className="w-80 border-r border-slate-100 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-950/50">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <h3 className="font-black text-slate-900 dark:text-slate-50 flex items-center gap-2 text-sm uppercase tracking-widest">
                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" /> My Pharmacies
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {connectedPharmacies.map((c) => (
                        <div
                            key={c.id}
                            onClick={() => setSelectedPharmacyId(c.pharmacy_id)}
                            className={`p-4 cursor-pointer border-b border-slate-100 dark:border-slate-800 transition-all hover:bg-white dark:hover:bg-slate-900 ${selectedPharmacyId === c.pharmacy_id ? 'bg-white dark:bg-slate-900 border-l-4 border-l-blue-600 dark:border-l-blue-500 shadow-sm' : ''}`}
                        >
                            <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12 border-2 border-slate-100 dark:border-slate-800 shadow-sm">
                                    <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 text-blue-700 dark:text-blue-300 font-black">
                                        {c.pharmacy?.pharmacy_name?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-slate-900 dark:text-slate-100 truncate text-sm">{c.pharmacy?.pharmacy_name}</p>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight truncate mt-0.5">
                                        {c.pharmacy?.phone || 'Connected'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {connectedPharmacies.length === 0 && (
                        <div className="p-12 text-center text-slate-400 dark:text-slate-500">
                            <p className="text-xs font-bold uppercase tracking-widest leading-relaxed">No pharmacies<br />connected</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side - Chat Window */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
                {activePharmacy ? (
                    <div className="flex-1 flex flex-col min-h-0">
                        {/* Header */}
                        <div className="p-4 px-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shadow-sm z-10">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-10 w-10 border-2 border-blue-50 dark:border-blue-900/50">
                                    <AvatarFallback className="bg-blue-600 text-white font-black">
                                        {activePharmacy.pharmacy_name?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="text-sm font-black text-slate-900 dark:text-slate-50 uppercase tracking-wider">{activePharmacy.pharmacy_name}</h2>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Pharmacist Online</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="ghost" className="rounded-full h-10 w-10 p-0 text-slate-400"><Clock className="h-5 w-5" /></Button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 dark:bg-slate-950/30">
                            <div className="text-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-700 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-4 py-1.5 rounded-full shadow-sm">Conversation Started</span>
                            </div>

                            {chatHistory.map((m) => (
                                <div key={m.id} className={`flex ${m.sender === 'patient' ? 'justify-end' : 'justify-start'}`}>
                                    {m.type === 'bill' ? (
                                        <Card className="w-72 border-indigo-100 dark:border-indigo-900 shadow-xl shadow-indigo-50/50 dark:shadow-none rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
                                            <div className="bg-indigo-600 p-3 flex justify-between items-center text-white">
                                                <div className="flex items-center gap-2">
                                                    <Receipt className="h-3.3 w-3.3" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">New Bill Received</span>
                                                </div>
                                                <Badge className="bg-white/20 text-white border-none text-[9px] uppercase font-black font-mono">₹{m.amount || m.metadata?.amount}</Badge>
                                            </div>
                                            <CardContent className="p-4 space-y-3">
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total to Pay</p>
                                                        <p className="text-xl font-black text-slate-900 dark:text-slate-50 leading-none mt-1 font-mono">₹{(m.amount || m.metadata?.amount || 0).toFixed(2)}</p>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handlePayBill(m.metadata?.bill_id)}
                                                        className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 dark:shadow-none rounded-xl px-4 text-[10px] font-bold h-8"
                                                    >
                                                        <CreditCard className="h-3 w-3 mr-1.5" /> Pay
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <div className={`max-w-[70%] rounded-2xl p-4 shadow-sm ${m.sender_id !== selectedPharmacyId ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none'}`}>
                                            <p className="text-sm font-medium leading-relaxed">{m.content}</p>
                                            <p className={`text-[10px] mt-2 font-bold ${m.sender_id !== selectedPharmacyId ? 'text-blue-200' : 'text-slate-400 dark:text-slate-500'}`}>
                                                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Specific Pending Bills for this pharmacy from DB */}
                            {bills.filter(b => b.pharmacy_id === selectedPharmacyId && b.status === 'unpaid').map(bill => (
                                <div key={bill.id} className="flex justify-start">
                                    <Card className="w-80 border-indigo-100 dark:border-indigo-900 shadow-xl shadow-indigo-50/50 dark:shadow-none rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
                                        <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
                                            <div className="flex items-center gap-2">
                                                <Receipt className="h-4 w-4" />
                                                <span className="text-xs font-black uppercase tracking-widest">Official Bill</span>
                                            </div>
                                            <Badge className="bg-white/20 text-white border-none text-[10px] uppercase font-black">Unpaid</Badge>
                                        </div>
                                        <CardContent className="p-5 space-y-4">
                                            <div className="space-y-2">
                                                {(bill.items as any[]).map((item, idx) => (
                                                    <div key={idx} className="flex justify-between text-xs font-medium">
                                                        <span className="text-slate-500 dark:text-slate-400">{item.name} <span className="text-[10px] text-slate-300 dark:text-slate-600">×{item.quantity}</span></span>
                                                        <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">₹{(item.price * item.quantity).toFixed(2)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="pt-4 border-t border-dashed border-slate-100 dark:border-slate-800 flex justify-between items-end">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Total Amount</p>
                                                    <p className="text-2xl font-black text-slate-900 dark:text-slate-50 leading-none mt-1 font-mono">₹{bill.total_amount?.toFixed(2)}</p>
                                                </div>
                                                <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none rounded-xl px-6 font-black text-xs h-10">
                                                    Pay Now
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            ))}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-2 pl-4 rounded-2xl focus-within:border-blue-300 dark:focus-within:border-blue-700 focus-within:ring-4 focus-within:ring-blue-50 dark:focus-within:ring-blue-900/20 transition-all">
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 dark:text-slate-600 hover:text-blue-600">
                                    <ImageIcon className="h-5 w-5" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 dark:text-slate-600 hover:text-blue-600">
                                    <Paperclip className="h-5 w-5" />
                                </Button>
                                <input
                                    type="text"
                                    className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                    placeholder={`Message ${activePharmacy.pharmacy_name}...`}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                />
                                <Button
                                    size="sm"
                                    className="h-10 w-10 p-0 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-100 dark:shadow-none transition-all active:scale-90"
                                    onClick={handleSendMessage}
                                >
                                    <Send className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 p-12 text-center">
                        <div className="bg-slate-50 dark:bg-slate-950 p-8 rounded-full mb-6 border border-slate-100 dark:border-slate-800 shadow-inner">
                            <Receipt className="h-12 w-12 opacity-20" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-slate-50 uppercase tracking-widest mb-2">Select a Pharmacy</h3>
                        <p className="max-w-xs text-xs font-bold text-slate-400 dark:text-slate-500 leading-relaxed uppercase tracking-tight">Select a pharmacy from the left to start a conversation and view your bills.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
