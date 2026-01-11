
import { createClient } from '@/utils/supabase/server'
import PharmacyShell from './components/PharmacyShell'

export default async function PharmacyPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div>Please sign in</div>
    }

    // Fetch profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Fetch orders
    const { data: orders } = await supabase
        .from('orders')
        .select(`
            *,
            patient:profiles!patient_id(full_name, phone),
            prescription:prescriptions(*)
        `)
        .order('created_at', { ascending: false })

    // Fetch inventory
    const { data: inventory } = await supabase
        .from('inventory')
        .select('*')
        .eq('pharmacy_id', user.id)
        .order('name', { ascending: true })

    // Fetch bills
    const { data: bills } = await supabase
        .from('bills')
        .select(`
            *,
            patient:profiles!patient_id(full_name)
        `)
        .eq('pharmacy_id', user.id)
        .order('created_at', { ascending: false })

    // Fetch connected patients
    const { data: connectedPatients } = await supabase
        .from('patient_pharmacies')
        .select(`
            id,
            patient:profiles!patient_id(id, full_name, phone)
        `)
        .eq('pharmacy_id', user.id)

    return (
        <PharmacyShell
            profile={profile}
            orders={orders || []}
            inventory={inventory || []}
            bills={bills || []}
            connectedPatients={connectedPatients?.map((p: any) => p.patient) || []}
        />
    )
}
