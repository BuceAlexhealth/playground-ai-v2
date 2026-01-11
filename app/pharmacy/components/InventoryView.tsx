
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { addInventoryItem, updateInventory, bulkAddInventory } from '../actions'
import { Plus, Search, Edit2, Check, X, Upload, FileText } from 'lucide-react'

export default function InventoryView({ inventory }: { inventory: any[] }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [isAdding, setIsAdding] = useState(false)
    const [isBulkAdding, setIsBulkAdding] = useState(false)
    const [csvInput, setCsvInput] = useState('')
    const [newItem, setNewItem] = useState({ name: '', quantity: 0, price: 0 })
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editValue, setEditValue] = useState({ quantity: 0, price: 0 })

    const filteredInventory = inventory.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleAdd = async () => {
        if (!newItem.name) return
        await addInventoryItem(newItem.name, newItem.quantity, newItem.price)
        setIsAdding(false)
        setNewItem({ name: '', quantity: 0, price: 0 })
    }

    const handleUpdate = async (id: string) => {
        await updateInventory(id, editValue)
        setEditingId(null)
    }


    const handleBulkUpload = async () => {
        // Simple CSV parser: name,quantity,price
        const lines = csvInput.split('\n').filter(line => line.trim())
        processLines(lines)
    }

    const processLines = async (lines: string[]) => {
        const items = lines.map(line => {
            const [name, qty, price] = line.split(',')
            return {
                name: name.trim(),
                quantity: parseInt(qty) || 0,
                price: parseFloat(price) || 0
            }
        }).filter(item => item.name)

        if (items.length > 0) {
            await bulkAddInventory(items)
            setIsBulkAdding(false)
            setCsvInput('')
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            const content = event.target?.result as string
            const lines = content.split('\n').filter(line => line.trim())
            // Skip header if it exists
            if (lines[0].toLowerCase().includes('name') || lines[0].toLowerCase().includes('quantity')) {
                lines.shift()
            }
            processLines(lines)
        }
        reader.readAsText(file)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search medicines..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setIsBulkAdding(!isBulkAdding)} variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50">
                        <Upload className="h-4 w-4 mr-2" /> Bulk Upload
                    </Button>
                    <Button onClick={() => setIsAdding(!isAdding)} className="bg-purple-600 hover:bg-purple-700 text-white">
                        <Plus className="h-4 w-4 mr-2" /> Add Medicine
                    </Button>
                </div>
            </div>

            {isBulkAdding && (
                <Card className="border-purple-100 dark:border-purple-800 bg-purple-50/20 dark:bg-purple-950/20">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-purple-900 dark:text-purple-100">Bulk Upload Stock</CardTitle>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Format: Medicine Name, Quantity, Price (e.g. Paracetamol, 50, 5.99)</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setIsBulkAdding(false)}><X className="h-4 w-4" /></Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Option 1: Paste CSV Data</label>
                                <textarea
                                    className="w-full h-32 p-3 text-sm border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-mono bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-inner"
                                    placeholder="Medicine Name, 10, 5.00&#10;Aspirin, 100, 2.50"
                                    value={csvInput}
                                    onChange={(e) => setCsvInput(e.target.value)}
                                />
                                <Button onClick={handleBulkUpload} className="w-full bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-100 dark:shadow-none">
                                    Upload {csvInput.split('\n').filter(l => l.trim()).length} Pasted Items
                                </Button>
                            </div>

                            <div className="flex flex-col">
                                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Option 2: Upload CSV File</label>
                                <div className="flex-1 border-2 border-dashed border-purple-100 dark:border-purple-800 rounded-xl bg-purple-50/10 dark:bg-purple-950/10 flex flex-col items-center justify-center p-6 transition-colors hover:bg-purple-50/20 dark:hover:bg-purple-900/10 group cursor-pointer relative">
                                    <input
                                        type="file"
                                        accept=".csv"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={handleFileChange}
                                    />
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-purple-50 dark:border-purple-900 group-hover:scale-110 transition-transform mb-4">
                                        <FileText className="h-8 w-8 text-purple-600" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Drop your CSV file here</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">or click to browse from computer</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {isAdding && (
                <Card className="border-purple-100 dark:border-purple-800 bg-purple-50/30 dark:bg-purple-950/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-purple-900 dark:text-purple-100">Add New Inventory Item</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Medicine Name</label>
                                <Input
                                    placeholder="e.g. Paracetamol"
                                    value={newItem.name}
                                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Quantity</label>
                                <Input
                                    type="number"
                                    value={newItem.quantity}
                                    onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Price (₹)</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={newItem.price}
                                    onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleAdd} className="flex-1 bg-purple-600">Save</Button>
                                <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Medicine Name</th>
                            <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase text-center">In Stock</th>
                            <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase text-center">Price</th>
                            <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredInventory.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-slate-900 dark:text-slate-50">{item.name}</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {editingId === item.id ? (
                                        <Input
                                            type="number"
                                            className="w-20 mx-auto"
                                            value={editValue.quantity}
                                            onChange={(e) => setEditValue({ ...editValue, quantity: parseInt(e.target.value) || 0 })}
                                        />
                                    ) : (
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.quantity < 10 ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'}`}>
                                            {item.quantity} units
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {editingId === item.id ? (
                                        <Input
                                            type="number"
                                            step="0.01"
                                            className="w-24 mx-auto"
                                            value={editValue.price}
                                            onChange={(e) => setEditValue({ ...editValue, price: parseFloat(e.target.value) || 0 })}
                                        />
                                    ) : (
                                        <span className="text-slate-600 dark:text-slate-400 font-medium">₹{item.price}</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {editingId === item.id ? (
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="ghost" className="text-green-600" onClick={() => handleUpdate(item.id)}>
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="ghost" className="text-red-400" onClick={() => setEditingId(null)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-slate-400 hover:text-purple-600"
                                            onClick={() => {
                                                setEditingId(item.id)
                                                setEditValue({ quantity: item.quantity, price: item.price })
                                            }}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
