'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function connectToPharmacy(pharmacyId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect(`/login?next=/connect?pharmacy_id=${pharmacyId}`)
    }

    const { error } = await supabase
        .from('patient_pharmacies')
        .insert({
            patient_id: user.id,
            pharmacy_id: pharmacyId
        })

    if (error) {
        if (error.code === '23505') { // Unique violation
            // Already connected, just redirect
            redirect('/patient')
        }
        console.error('Error connecting to pharmacy:', error)
        throw new Error('Failed to connect')
    }

    redirect('/patient')
}
