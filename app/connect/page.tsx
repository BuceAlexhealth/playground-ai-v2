import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { connectToPharmacy } from './actions'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Store, CheckCircle2 } from 'lucide-react'

export default async function ConnectPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { pharmacy_id } = await searchParams

    if (!pharmacy_id || Array.isArray(pharmacy_id)) {
        return <div>Invalid Pharmacy Link</div>
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect(`/login?next=/connect?pharmacy_id=${pharmacy_id}`)
    }

    // Fetch pharmacy details
    const { data: pharmacy } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', pharmacy_id)
        .eq('role', 'pharmacist') // Ensure it is a pharmacy
        .single()

    if (!pharmacy) {
        return <div>Pharmacy not found</div>
    }

    // Check if already connected
    const { data: existingConnection } = await supabase
        .from('patient_pharmacies')
        .select('*')
        .eq('patient_id', user.id)
        .eq('pharmacy_id', pharmacy_id)
        .single()

    if (existingConnection) {
        redirect('/patient')
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-xl border-slate-200">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-purple-100 p-4 rounded-full mb-4 w-fit">
                        <Store className="h-8 w-8 text-purple-600" />
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-900">Connect to Pharmacy</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-slate-500">
                        You are about to connect your account with:
                    </p>
                    <div className="bg-slate-100 p-4 rounded-xl">
                        <h2 className="text-lg font-black text-slate-800">{pharmacy.pharmacy_name || 'Unnamed Pharmacy'}</h2>
                        <p className="text-sm text-slate-400 mt-1">Pharmacist: {pharmacy.full_name}</p>
                    </div>
                    <p className="text-xs text-slate-400">
                        By connecting, you can easily send prescriptions and receive bills from this pharmacy.
                    </p>
                </CardContent>
                <CardFooter>
                    <form action={connectToPharmacy.bind(null, pharmacy_id)} className="w-full">
                        <Button className="w-full bg-purple-600 hover:bg-purple-700 text-lg py-6 font-bold">
                            <CheckCircle2 className="h-5 w-5 mr-2" />
                            Confirm Connection
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    )
}
