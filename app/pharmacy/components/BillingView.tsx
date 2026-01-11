
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Receipt, Calendar, User, DollarSign } from 'lucide-react'

export default function BillingView({ bills }: { bills: any[] }) {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Billing History</h2>
                <Badge variant="outline" className="bg-white dark:bg-slate-900 dark:text-slate-100">{bills.length} Total Bills</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bills.map((bill) => (
                    <Card key={bill.id} className="border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-950/50 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                    <Receipt className="h-4 w-4 text-purple-600" /> Bill #{bill.id.slice(0, 8)}
                                </CardTitle>
                                <Badge className={bill.status === 'paid' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'}>
                                    {bill.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <User className="h-4 w-4" />
                                    <span>{bill.patient?.full_name || 'Walk-in Patient'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                                    <Calendar className="h-3 w-3" />
                                    <span>{new Date(bill.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-950 rounded-lg p-3 space-y-2">
                                {(bill.items as any[]).map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-xs">
                                        <span className="text-slate-600 dark:text-slate-400">{item.name} x{item.quantity}</span>
                                        <span className="font-medium text-slate-900 dark:text-slate-200">₹{(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <span className="text-sm font-bold text-slate-500">Total Amount</span>
                                <span className="text-lg font-black text-purple-600">₹{bill.total_amount?.toFixed(2)}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {bills.length === 0 && (
                <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                    <Receipt className="h-12 w-12 mx-auto mb-4 opacity-10" />
                    <p>No bills generated yet.</p>
                </div>
            )}
        </div>
    )
}
