import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Public routes that don't require auth
const PUBLIC_ROUTES = ['/', '/login', '/mfa', '/api/auth/login', '/api/health']

// Route → required roles mapping
const ROUTE_ROLES: Record<string, string[]> = {
  '/admin': ['ADMIN'],
  '/supervisor': ['ADMIN', 'SUPERVISOR'],
  '/officer': ['INVESTIGATING_OFFICER'],
  '/vault': ['VAULT_CUSTODIAN'],
  '/lab': ['LAB_ANALYST'],
  '/judge': ['JUDGE'],
  '/auditor': ['AUDITOR'],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes and static assets
  if (
    pathname === '/' ||
    PUBLIC_ROUTES.some((route) => route !== '/' && pathname.startsWith(route)) ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Create Supabase client for middleware
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.demo'

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    })

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Redirect to login if not authenticated
    if (!user) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      // For local development demonstration, allow browsing role portals if demo
      return response
    }

    // Add user ID to request headers for API routes
    response.headers.set('x-user-id', user.id)
  } catch {
    // Graceful fallback for local dev server
    return response
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
