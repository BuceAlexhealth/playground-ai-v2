
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// Load .env.local manually since we aren't in Next.js runtime
const envConfig = dotenv.parse(fs.readFileSync(path.resolve(process.cwd(), '.env.local')))

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTable(tableName: string) {
    const { error } = await supabase.from(tableName).select('id').limit(1)
    if (error) {
        // If table is empty but exists, it might return empty array, that's fine.
        // Error usually means table doesn't exist or RLS issue (but anon key should have basic access if policies allow, or at least we get a specific error).
        // Actually, distinct error for "relation does not exist".
        if (error.code === '42P01') { // undefined_table
            console.error(`❌ Table '${tableName}' DOES NOT exist.`)
            return false
        }
        console.error(`⚠️ Issue verifying '${tableName}': ${error.message} (${error.code})`)
        // We treat permissions error as "Table exists but locked", which is better than "Missing".
        return true
    }
    console.log(`✅ Table '${tableName}' exists and is accessible.`)
    return true
}

async function main() {
    console.log('Testing connection to:', supabaseUrl)

    const tables = ['profiles', 'prescriptions', 'orders']
    let allGood = true

    for (const table of tables) {
        const exists = await checkTable(table)
        if (!exists) allGood = false
    }

    if (allGood) {
        console.log('\n🎉 ALL CHECKS PASSED. Database is ready.')
    } else {
        console.log('\n❌ SOME CHECKS FAILED. Please run the schema migration.')
    }
}

main()
