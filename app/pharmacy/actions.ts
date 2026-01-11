'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { createClient as createJsClient } from '@supabase/supabase-js'

export async function updateOrderStatus(orderId: string, status: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)

    if (error) {
        console.error('Error updating order status:', error)
        return { error: error.message }
    }

    revalidatePath('/pharmacy')
    return { success: true }
}

export async function updateInventory(id: string, updates: { quantity?: number, price?: number }) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('inventory')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)

    if (error) {
        console.error('Error updating inventory:', error)
        return { error: error.message }
    }

    revalidatePath('/pharmacy')
    return { success: true }
}

export async function addInventoryItem(name: string, quantity: number, price: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
        .from('inventory')
        .insert({
            pharmacy_id: user.id,
            name,
            quantity,
            price
        })

    if (error) {
        console.error('Error adding inventory item:', error)
        return { error: error.message }
    }

    revalidatePath('/pharmacy')
    return { success: true }
}

export async function createBill(orderId: string | null, patientId: string, items: any[], totalAmount: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    // Use RPC for atomic transaction
    const { data: result, error } = await supabase.rpc('process_bill_transaction', {
        p_order_id: orderId,
        p_patient_id: patientId,
        p_items: items,
        p_total_amount: totalAmount
    })

    if (error) {
        console.error('Error creating bill (RPC):', error)
        return { error: error.message }
    }

    if (result && !result.success) {
        console.error('Bill transaction failed:', result.error)
        return { error: result.error || 'Transaction failed' }
    }

    // Send a message to the patient about the bill
    await sendMessage(patientId, `Generated bill for ₹${totalAmount.toFixed(2)}`, 'bill', {
        bill_id: result.bill_id,
        amount: totalAmount,
        items_count: items.length
    })

    revalidatePath('/pharmacy')
    return { success: true }
}

export async function bulkAddInventory(items: { name: string, quantity: number, price: number }[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    const itemsToInsert = items.map(item => ({
        ...item,
        pharmacy_id: user.id
    }))

    const { error } = await supabase
        .from('inventory')
        .insert(itemsToInsert)

    if (error) {
        console.error('Error bulk adding inventory:', error)
        return { error: error.message }
    }

    revalidatePath('/pharmacy')
    return { success: true }
}

export async function sendMessage(receiverId: string, content: string, type: string = 'text', metadata: any = {}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    const { data, error } = await supabase
        .from('messages')
        .insert({
            sender_id: user.id,
            receiver_id: receiverId,
            content,
            type,
            metadata
        })
        .select()
        .single()

    if (error) {
        console.error('Error sending message:', error)
        return { error: error.message }
    }

    return { success: true, data }
}

export async function getMessages(otherUserId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching messages:', error)
        return []
    }

    return data
}

export async function payBill(billId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    const { data: bill, error: billError } = await supabase
        .from('bills')
        .update({ status: 'paid' })
        .eq('id', billId)
        .select()
        .single()

    if (billError) {
        console.error('Error paying bill:', billError)
        return { error: billError.message }
    }

    if (bill) {
        await sendMessage(bill.pharmacy_id, `Paid bill #${bill.id.slice(0, 8)} of ₹${bill.total_amount}`, 'text')
    }

    revalidatePath('/patient')
    revalidatePath('/pharmacy')
    return { success: true }
}

export async function registerWalkInPatient(fullName: string, phone: string) {
    const supabase = await createClient()
    const { data: { user: pharmacist } } = await supabase.auth.getUser()

    if (!pharmacist) return { error: 'Not authenticated' }

    const supabasePublic = createJsClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const email = `${phone.replace(/\D/g, '')}@walkin.temp`
    const password = `Walkin${phone.replace(/\D/g, '').slice(-4)}!`

    const { data: authData, error: authError } = await supabasePublic.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                phone: phone,
                role: 'patient'
            }
        }
    })

    if (authError) {
        console.error('Error creating walk-in user:', authError)
        return { error: authError.message }
    }

    if (!authData.user) {
        return { error: 'Failed to create user' }
    }

    const newPatientId = authData.user.id

    if (authData.session) {
        const { error: profileError } = await supabasePublic
            .from('profiles')
            .upsert({
                id: newPatientId,
                full_name: fullName,
                phone: phone,
                role: 'patient'
            })

        if (profileError) {
            console.error('Error ensuring profile:', profileError)
        }
    }

    const { error: connectError } = await supabase
        .from('patient_pharmacies')
        .insert({
            patient_id: newPatientId,
            pharmacy_id: pharmacist.id
        })

    if (connectError) {
        if (!connectError.message.includes('duplicate')) {
            console.error('Error connecting patient:', connectError)
            return { error: connectError.message }
        }
    }

    revalidatePath('/pharmacy')
    return { success: true, patientId: newPatientId }
}

export async function getInventory() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('pharmacy_id', user.id)
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching inventory:', error)
        return []
    }

    return data
}
