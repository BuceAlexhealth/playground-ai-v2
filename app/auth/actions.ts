'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
})

const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    full_name: z.string().min(2),
    role: z.enum(['doctor', 'pharmacist', 'patient']),
    clinic_name: z.string().optional().nullable(),
    pharmacy_name: z.string().optional().nullable(),
})

export async function login(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    // Extract data from FormData
    const rawData = {
        email: formData.get('email'),
        password: formData.get('password'),
        full_name: formData.get('full_name'),
        role: formData.get('role'),
        clinic_name: formData.get('clinic_name'),
        pharmacy_name: formData.get('pharmacy_name'),
    }

    console.log("Raw Signup Data Received:", rawData)

    // Validate
    const result = signupSchema.safeParse(rawData)

    if (!result.success) {
        console.error("Signup validation failed:", result.error.format())
        return { error: `Validation failed: ${JSON.stringify(result.error.flatten().fieldErrors)}` }
    }

    const { email, password, full_name, role, clinic_name, pharmacy_name } = result.data

    console.log("Attempting signup for:", email)

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name,
                role,
                clinic_name,
                pharmacy_name,
            },
        },
    })

    if (error) {
        console.error("Supabase Signup Error:", error)
        return { error: error.message }
    }

    console.log("Signup successful. Session present:", !!data.session)

    // Revalidate and redirect immediately. 
    // If Supabase is configured to NOT require email confirmation, this will log them in.
    revalidatePath('/', 'layout')
    redirect('/')
}


export async function signout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}
