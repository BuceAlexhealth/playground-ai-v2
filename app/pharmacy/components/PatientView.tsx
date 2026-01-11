
'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { User, Pill, Clock, ChevronRight, Receipt, CheckCircle2, Package, Send } from 'lucide-react'
import { updateOrderStatus } from '../actions'
import { Input } from '@/components/ui/input'
import { CreateBillModal } from './CreateBillModal'
import { WalkInRegistrationModal } from './WalkInRegistrationModal'
import { Image as ImageIcon, FileText, MoreVertical, Paperclip, Smile, UserPlus, CreditCard } from 'lucide-react'
import { sendMessage, getMessages } from '../actions'
import { createClient } from '@/utils/supabase/client'

export default function PatientView({ orders, connectedPatients }: { orders: any[], connectedPatients: any[] }) {
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(orders[0]?.patient_id || connectedPatients[0]?.id || null)
    const [message, setMessage] = useState('')
    const [isBillModalOpen, setIsBillModalOpen] = useState(false)
    const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false)
    const [chatHistory, setChatHistory] = useState<any[]>([])

    const [supabase] = useState(() => createClient())

    // Fetch initial messages
    useEffect(() => {
        if (!selectedPatientId) return
        const fetchMessages = async () => {
            const msgs = await getMessages(selectedPatientId)
            setChatHistory(msgs)
        }
        fetchMessages()

        // Subscribe to real-time changes
        const channel = supabase
            .channel('realtime_messages')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages'
            }, (payload) => {
                const newMessage = payload.new
                // Only add if relevant to current selection
                if ((newMessage.sender_id === selectedPatientId) || (newMessage.receiver_id === selectedPatientId)) {
                    setChatHistory(prev => [...prev.filter(m => m.id !== newMessage.id), newMessage])
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [selectedPatientId, supabase])

    // Find the active order for the selected patient (if any)
    const activeOrder = orders.find(o => o.patient_id === selectedPatientId)
    // Find the patient profile from either orders or connected patients
    const activePatient = connectedPatients.find(p => p.id === selectedPatientId) || orders.find(o => o.patient_id === selectedPatientId)?.patient

    const handleSendMessage = async () => {
        if (!message.trim() || !selectedPatientId) return
        const res = await sendMessage(selectedPatientId, message)
        if (res.success) {
            setMessage('')
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-100 text-amber-700'
            case 'accepted': return 'bg-blue-100 text-blue-700'
            case 'ready': return 'bg-indigo-100 text-indigo-700'
            case 'completed': return 'bg-emerald-100 text-emerald-700'
            default: return 'bg-slate-100 text-slate-700'
        }
    }

    return (
        <div className="flex h-[calc(100vh-12rem)] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            {/* Left Sidebar - Patient List */}
            <div className="w-80 border-r border-slate-100 dark:border-slate-800 flex flex-col">
                <div className="p-4 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                    <h3 className="font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                        <User className="h-4 w-4 text-purple-600" /> Active Patients
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {orders.map((order) => (
                        <div
                            key={order.id}
                            onClick={() => setSelectedPatientId(order.patient_id)}
                            className={`p-4 cursor-pointer border-b border-slate-50 dark:border-slate-800 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 ${selectedPatientId === order.patient_id ? 'bg-purple-50 dark:bg-purple-900/20 border-l-4 border-l-purple-600' : ''}`}
                        >
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border border-slate-100 dark:border-slate-700 shadow-sm">
                                    <AvatarFallback className="bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900 dark:to-indigo-900 text-purple-700 dark:text-purple-300 font-bold">
                                        {order.patient?.full_name?.split(' ').map((n: any) => n[0]).join('')}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <p className="font-bold text-slate-900 dark:text-slate-50 truncate">{order.patient?.full_name}</p>
                                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${getStatusColor(order.status)} border-none`}>
                                            {order.status}
                                        </Badge>
                                        <p className="text-[11px] text-slate-500 truncate">
                                            {order.prescription?.medications ? `${(order.prescription.medications as any[]).length} meds` : 'View script'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {orders.length === 0 && (
                        <div className="p-8 text-center text-slate-400">
                            <Package className="h-8 w-8 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">No active orders</p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-y border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 mt-auto flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600" /> Connected Patients
                    </h3>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full"
                        onClick={() => setIsWalkInModalOpen(true)}
                    >
                        <UserPlus className="h-4 w-4" />
                    </Button>
                </div>
                <div className="h-1/3 overflow-y-auto border-t border-slate-100 dark:border-slate-800">
                    {connectedPatients?.map((patient) => (
                        <div
                            key={patient.id}
                            onClick={() => setSelectedPatientId(patient.id)}
                            className={`p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800 flex items-center gap-3 transition-all ${selectedPatientId === patient.id && !activeOrder ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-600' : ''}`}
                        >
                            <Avatar className="h-8 w-8 border border-slate-100 dark:border-slate-700">
                                <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold">
                                    {patient.full_name?.split(' ').map((n: any) => n[0]).join('')}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-bold text-sm text-slate-900 dark:text-slate-50">{patient.full_name}</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500">{patient.phone || 'No phone'}</p>
                            </div>
                        </div>
                    ))}
                    {(!connectedPatients || connectedPatients.length === 0) && (
                        <div className="p-4 text-center text-xs text-slate-400">
                            No active connections.
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side - Details & Billing */}
            <div className="flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-950/30">
                {activePatient ? (
                    <div className="flex-1 flex flex-col min-h-0">
                        {/* Header */}
                        <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shadow-sm">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12 border-2 border-purple-50 dark:border-purple-900/20">
                                    <AvatarFallback className={activeOrder ? "bg-purple-600 text-white font-bold" : "bg-blue-600 text-white font-bold"}>
                                        {activePatient.full_name?.split(' ').map((n: any) => n[0]).join('')}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">{activePatient.full_name}</h2>
                                    {activeOrder ? (
                                        <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> Requested {new Date(activeOrder.created_at).toLocaleString()}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-blue-600 font-bold flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3" /> Connected Patient
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    className="bg-purple-600 hover:bg-purple-700 font-bold px-6 shadow-lg shadow-purple-100"
                                    onClick={() => setIsBillModalOpen(true)}
                                >
                                    <Receipt className="h-4 w-4 mr-2" /> Create Bill
                                </Button>
                                {activeOrder?.status === 'pending' && (
                                    <Button size="sm" variant="outline" className="text-blue-600 border-blue-200" onClick={() => updateOrderStatus(activeOrder.id, 'accepted')}>
                                        Accept Order
                                    </Button>
                                )}
                                {activeOrder?.status === 'accepted' && (
                                    <Button size="sm" variant="outline" className="text-indigo-600 border-indigo-200" onClick={() => updateOrderStatus(activeOrder.id, 'ready')}>
                                        Mark Ready
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 flex flex-col min-h-0">
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {/* Chat Messages */}
                                <div className="space-y-4">
                                    <div className="text-center py-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-600 bg-slate-50 dark:bg-slate-950 px-4 py-1.5 rounded-full border border-slate-100 dark:border-slate-800">Today</span>
                                    </div>

                                    {chatHistory.map((m) => {
                                        const isPharmacy = m.sender_id !== selectedPatientId
                                        return (
                                            <div key={m.id} className={`flex ${isPharmacy ? 'justify-end' : 'justify-start'}`}>
                                                {m.type === 'bill' ? (
                                                    <Card className="w-64 border-purple-100 dark:border-purple-900 shadow-lg shadow-purple-50/50 dark:shadow-none rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
                                                        <div className="bg-purple-600 p-3 flex justify-between items-center text-white">
                                                            <div className="flex items-center gap-2">
                                                                <Receipt className="h-3.5 w-3.5" />
                                                                <span className="text-[10px] font-black uppercase tracking-widest">Bill Sent</span>
                                                            </div>
                                                            <Badge className="bg-white/20 text-white border-none text-[9px] uppercase font-black font-mono">#{m.metadata?.bill_id?.slice(0, 4)}</Badge>
                                                        </div>
                                                        <CardContent className="p-4">
                                                            <div className="flex justify-between items-end">
                                                                <div>
                                                                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Amount</p>
                                                                    <p className="text-xl font-black text-slate-900 dark:text-slate-50 leading-none mt-1 font-mono">₹{m.metadata?.amount?.toFixed(2)}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{m.metadata?.items_count} Items</p>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ) : (
                                                    <div className={`max-w-[70%] rounded-2xl p-4 shadow-sm ${isPharmacy ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none'}`}>
                                                        <p className="text-sm font-medium">{m.content}</p>
                                                        <p className={`text-[10px] mt-1.5 font-bold ${isPharmacy ? 'text-purple-200' : 'text-slate-400 dark:text-slate-500'}`}>
                                                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Placeholder for Prescription if active */}
                                {activeOrder?.prescription?.medications && (
                                    <div className="bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800 rounded-3xl p-6 mt-8">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-xs font-black text-purple-900 dark:text-purple-100 uppercase tracking-widest flex items-center gap-2">
                                                <Pill className="h-4 w-4" /> Prescription Attached
                                            </h4>
                                            <Badge className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border-none text-[10px] uppercase font-black">Script #{activeOrder.id.slice(0, 8)}</Badge>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {(activeOrder.prescription.medications as any[]).map((med, idx) => (
                                                <div key={idx} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-purple-50 dark:border-purple-900/20 shadow-sm">
                                                    <p className="font-bold text-slate-900 dark:text-slate-50 text-sm">{med.name}</p>
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{med.dosage} • {med.frequency}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Chat Input */}
                            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-2 pl-4 rounded-2xl focus-within:border-purple-300 dark:focus-within:border-purple-700 focus-within:ring-4 focus-within:ring-purple-50 dark:focus-within:ring-purple-900/20 transition-all">
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 dark:text-slate-500 hover:text-purple-600 dark:hover:text-purple-400">
                                        <ImageIcon className="h-5 w-5" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 dark:text-slate-500 hover:text-purple-600 dark:hover:text-purple-400">
                                        <Paperclip className="h-5 w-5" />
                                    </Button>
                                    <input
                                        type="text"
                                        className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                        placeholder={`Message ${activePatient.full_name}...`}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    />
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 dark:text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 mr-1">
                                        <Smile className="h-5 w-5" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="h-10 w-10 p-0 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg shadow-purple-100 dark:shadow-none transition-all active:scale-90"
                                        onClick={handleSendMessage}
                                    >
                                        <Send className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Modals */}
                        <CreateBillModal
                            isOpen={isBillModalOpen}
                            onClose={() => setIsBillModalOpen(false)}
                            patient={activePatient}
                            activeOrder={activeOrder}
                        />
                        <WalkInRegistrationModal
                            isOpen={isWalkInModalOpen}
                            onClose={() => setIsWalkInModalOpen(false)}
                            onPatientRegistered={(id) => {
                                setSelectedPatientId(id)
                                // We also need to refresh the connected patients list, but since it's passed as prop, 
                                // we might need to rely on the revalidatePath in the action to refresh the page/server component
                                // or optimistically update. For now, since it revalidates path, a router refresh might be needed.
                                // Actually, server actions revalidatePath usually triggers a refresh on the client implicitly.
                            }}
                        />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <div className="bg-slate-100 p-6 rounded-full mb-4">
                            <User className="h-12 w-12 opacity-20" />
                        </div>
                        <p>Select a patient to view details and process order</p>
                    </div>
                )}
            </div>
        </div>
    )
}

function Plus(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    )
}
