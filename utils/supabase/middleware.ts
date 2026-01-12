
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    // 1. Parse the hostname to detect subdomains
    const hostname = request.headers.get("host") || "";
    // Handle localhost (remove port) and production domains
    // e.g. "doctor.localhost:3000" -> "doctor.localhost" -> subdomain "doctor"
    const currentHost = hostname.replace(/:\d+$/, "");
    const subdomain = currentHost.split('.')[0];

    // Define allowed subdomains and their mapping
    const subdomains = ['doctor', 'patient', 'pharmacy'];
    const isSubdomain = subdomains.includes(subdomain);

    // 2. Prepare the response (Rewrite if subdomain, otherwise Next)
    // We need to preserve this logic during the createServerClient flow
    const createResponse = () => {
        if (isSubdomain) {
            // Rewrite logic: e.g. doctor.domain.com/dashboard -> /doctor/dashboard
            const url = request.nextUrl.clone();
            // Avoid double-stacking if the path already starts with the subdomain (edge case)
            if (!url.pathname.startsWith(`/${subdomain}`)) {
                url.pathname = `/${subdomain}${url.pathname}`;
            }
            return NextResponse.rewrite(url, { request });
        }
        return NextResponse.next({ request });
    };

    let supabaseResponse = createResponse();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    // Re-create the response to apply cookies to the *correct* object (Result or Rewrite)
                    supabaseResponse = createResponse();

                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Optional: Add specific redirects here if needed
    // e.g. if (!user && isSubdomain) { ... redirect to login ... }

    return supabaseResponse
}
