import { signout } from '../auth/actions'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Receipt, CreditCard, Clock, Pill, LayoutDashboard, MessageSquare } from 'lucide-react'
import { ModeToggle } from '@/components/mode-toggle'
import { PatientChatView } from './components/PatientChatView'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function PatientDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Sign in required</div>

    // Fetch bills
    const { data: bills } = await supabase
        .from('bills')
        .select(`
            *,
            pharmacy:profiles!pharmacy_id(pharmacy_name)
        `)
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false })

    // Fetch active prescriptions
    const { data: prescriptions } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', user.id)
        .eq('status', 'active')

    // Fetch connected pharmacies
    const { data: connectedPharmacies } = await supabase
        .from('patient_pharmacies')
        .select(`
            *,
            pharmacy:profiles!pharmacy_id(*)
        `)
        .eq('patient_id', user.id)

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-600 rounded-2xl shadow-lg shadow-blue-100">
                                <Pill className="h-6 w-6 text-white" />
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Health Hub</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <ModeToggle />
                        <form action={signout}>
                            <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-red-500">Sign Out</Button>
                        </form>
                    </div>
                </div>

                <Tabs defaultValue="chat" className="space-y-6">
                    <TabsList className="bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm inline-flex h-auto">
                        <TabsTrigger value="chat" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest transition-all">
                            <MessageSquare className="h-4 w-4 mr-2" /> Conversations
                        </TabsTrigger>
                        <TabsTrigger value="overview" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-purple-600 data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest transition-all">
                            <LayoutDashboard className="h-4 w-4 mr-2" /> Medical History
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="chat" className="mt-0 outline-none">
                        <PatientChatView
                            connectedPharmacies={connectedPharmacies || []}
                            prescriptions={prescriptions || []}
                            bills={bills || []}
                        />
                    </TabsContent>

                    <TabsContent value="overview" className="mt-0 outline-none space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Left Column - Prescriptions */}
                            <div className="lg:col-span-7 space-y-6">
                                <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 px-2">
                                    <Clock className="h-3 w-3 text-purple-600 dark:text-purple-400" /> Active Prescriptions
                                </h2>
                                {!prescriptions || prescriptions.length === 0 ? (
                                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-16 text-center shadow-sm">
                                        <Pill className="h-12 w-12 mx-auto mb-4 text-slate-100 dark:text-slate-800" />
                                        <p className="text-slate-400 dark:text-slate-600 font-bold text-xs uppercase tracking-widest">No active scripts</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {prescriptions.map(p => (
                                            <Card key={p.id} className="border-slate-100 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all group dark:bg-slate-900">
                                                <CardHeader className="bg-slate-50/50 dark:bg-slate-950/50 py-4">
                                                    <CardTitle className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex justify-between">
                                                        <span>Script #{p.id.slice(0, 8)}</span>
                                                        <span className="text-purple-600 dark:text-purple-400">Active</span>
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-6">
                                                    {p.medications ? (
                                                        <ul className="space-y-3">
                                                            {(p.medications as any[]).map((m, i) => (
                                                                <li key={i} className="flex justify-between items-center group/item">
                                                                    <div>
                                                                        <p className="font-black text-slate-800 dark:text-slate-100 text-sm group-hover/item:text-purple-600 dark:group-hover/item:text-purple-400 transition-colors">{m.name}</p>
                                                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight">{m.frequency}</p>
                                                                    </div>
                                                                    <span className="text-xs font-black text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950 px-3 py-1 rounded-full">{m.dosage}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : <p className="text-xs text-slate-400 font-bold uppercase py-4">No data</p>}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Right Column - Legacy Billing View for History */}
                            <div className="lg:col-span-5 space-y-6">
                                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 px-2">
                                    <Receipt className="h-3 w-3 text-indigo-600" /> Billing History
                                </h2>
                                <div className="space-y-4">
                                    {bills?.map(bill => (
                                        <Card key={bill.id} className={`border-slate-100 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900 transition-all hover:scale-[1.02] ${bill.status === 'unpaid' ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}>
                                            <div className={`${bill.status === 'unpaid' ? 'bg-indigo-600' : 'bg-slate-800 dark:bg-slate-950'} p-4 flex justify-between items-center text-white`}>
                                                <div className="flex items-center gap-2">
                                                    <Receipt className="h-4 w-4" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{bill.pharmacy?.pharmacy_name}</span>
                                                </div>
                                                <Badge className="bg-white/20 text-white border-none text-[9px] uppercase font-black">{bill.status}</Badge>
                                            </div>
                                            <CardContent className="p-5 font-medium">
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Amount Paid</p>
                                                        <p className="text-xl font-black text-slate-900 dark:text-slate-50 leading-none mt-1 font-mono">₹{bill.total_amount?.toFixed(2)}</p>
                                                    </div>
                                                    <p className="text-[9px] text-slate-300 dark:text-slate-600 font-bold uppercase">{new Date(bill.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
