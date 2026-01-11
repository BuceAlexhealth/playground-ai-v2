'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Receipt, X, Pill } from 'lucide-react'
import { createBill, getInventory } from '../actions'

interface CreateBillModalProps {
    isOpen: boolean
    onClose: () => void
    patient: any
    activeOrder?: any
    onBillCreated?: () => void
}

export function CreateBillModal({ isOpen, onClose, patient, activeOrder, onBillCreated }: CreateBillModalProps) {
    const [billItems, setBillItems] = useState<{ name: string, quantity: number, price: number }[]>([])
    const [newItem, setNewItem] = useState({ name: '', quantity: 1, price: 0 })
    const [inventory, setInventory] = useState<any[]>([])
    const [suggestions, setSuggestions] = useState<any[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)

    useEffect(() => {
        const fetchInventory = async () => {
            const data = await getInventory()
            setInventory(data)
        }
        if (isOpen) {
            fetchInventory()
        }
    }, [isOpen])

    const handleNameChange = (val: string) => {
        setNewItem({ ...newItem, name: val })
        if (val.trim()) {
            const filtered = inventory.filter(item =>
                item.name.toLowerCase().includes(val.toLowerCase())
            )
            setSuggestions(filtered)
            setShowSuggestions(true)
        } else {
            setSuggestions([])
            setShowSuggestions(false)
        }
    }

    const selectProduct = (p: any) => {
        setNewItem({
            name: p.name,
            quantity: 1,
            price: p.price
        })
        setShowSuggestions(false)
    }

    // If there's an active order, pre-fill some items if desired
    // (Optional: we could auto-add meds from prescription)

    const addToBill = () => {
        if (!newItem.name) return
        setBillItems([...billItems, newItem])
        setNewItem({ name: '', quantity: 1, price: 0 })
    }

    const removeItem = (index: number) => {
        setBillItems(billItems.filter((_, i) => i !== index))
    }

    const totalAmount = billItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)

    const [isLoading, setIsLoading] = useState(false)

    const handleCreateBill = async () => {
        if (!patient) return
        setIsLoading(true)
        try {
            const res = await createBill(activeOrder?.id || null, patient.id, billItems, totalAmount)
            if (res.success) {
                setBillItems([])
                onBillCreated?.()
                onClose()
            } else {
                alert(res.error || 'Failed to create bill')
            }
        } catch (e) {
            console.error(e)
            alert('An unexpected error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    const addFromPrescription = (med: any) => {
        const invItem = inventory.find(i => i.name.toLowerCase() === med.name.toLowerCase())
        setNewItem({
            name: med.name,
            quantity: 1,
            price: invItem ? invItem.price : 0
        })
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="bg-purple-600 p-6 text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <Receipt className="h-6 w-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black">Create Digital Bill</DialogTitle>
                            <p className="text-purple-100 dark:text-purple-200 text-xs font-medium">Billing for {patient?.full_name}</p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        {activeOrder?.prescription?.medications && (
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">From Prescription</label>
                                <div className="space-y-2">
                                    {(activeOrder.prescription.medications as any[]).map((med, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-purple-200 dark:hover:border-purple-800 transition-colors">
                                            <div>
                                                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{med.name}</p>
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400">{med.dosage}</p>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 rounded-xl bg-white dark:bg-slate-900 shadow-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                                onClick={() => addFromPrescription(med)}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-4 pt-2">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Manual Entry</label>
                            <div className="space-y-3">
                                <div className="relative">
                                    <Input
                                        placeholder="Search inventory..."
                                        value={newItem.name}
                                        onChange={(e) => handleNameChange(e.target.value)}
                                        onFocus={() => newItem.name && setShowSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                        className="bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 rounded-xl font-medium dark:text-slate-100"
                                    />
                                    {showSuggestions && suggestions.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                            {suggestions.map((p, i) => (
                                                <div
                                                    key={i}
                                                    className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-50 dark:border-slate-700 last:border-0"
                                                    onClick={() => selectProduct(p)}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{p.name}</p>
                                                            <p className="text-[10px] text-slate-400">Stock: {p.quantity} units</p>
                                                        </div>
                                                        <span className="text-xs font-black text-purple-600 font-mono">₹{p.price}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 px-1">Quantity</label>
                                        <Input
                                            type="number"
                                            value={newItem.quantity}
                                            onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                                            className="bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 rounded-xl font-medium dark:text-slate-100"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 px-1">Price (₹)</label>
                                        <Input
                                            type="number"
                                            value={newItem.price}
                                            onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
                                            className="bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 rounded-xl font-medium dark:text-slate-100"
                                        />
                                    </div>
                                </div>
                                <Button
                                    onClick={addToBill}
                                    className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-700 text-white rounded-xl font-bold py-6"
                                >
                                    <Plus className="h-4 w-4 mr-2" /> Add to Item List
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800 p-6">
                        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Bill Summary</h3>
                        <div className="flex-1 space-y-3 overflow-y-auto min-h-[200px]">
                            {billItems.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center group">
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 text-slate-300 dark:text-slate-700 hover:text-red-500 dark:hover:text-red-400"
                                            onClick={() => removeItem(idx)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{item.name} <span className="text-[10px] text-slate-400 dark:text-slate-600">×{item.quantity}</span></span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">₹{(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                            {billItems.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-2 opacity-30 py-12">
                                    <Receipt className="h-8 w-8" />
                                    <p className="text-xs font-medium">No items added yet</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 pt-6 border-t border-dashed border-slate-200 dark:border-slate-800 space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Amount</p>
                                    <p className="text-3xl font-black text-purple-600 dark:text-purple-400 leading-none mt-1 font-mono">₹{totalAmount.toFixed(2)}</p>
                                </div>
                            </div>
                            <Button
                                onClick={handleCreateBill}
                                disabled={billItems.length === 0 || isLoading}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-2xl py-7 font-black text-lg shadow-xl shadow-purple-100 dark:shadow-none transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isLoading ? 'Sending...' : 'Generate & Send'}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
