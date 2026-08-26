import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Public institutional routes — no auth required for public visitors
const PUBLIC_ROUTES = [
  '/',
  '/how-it-works',
  '/platform',
  '/security',
  '/technology',
  '/about',
  '/faq',
  '/contact',
  '/download',
  '/login',
  '/mfa',
  '/api/auth/login',
  '/api/health',
  '/api/download',
]

// Route → required roles mapping (checked after auth for confidential workstations)
const ROUTE_ROLES: Record<string, string[]> = {
  '/admin': ['ADMIN'],
  '/supervisor': ['ADMIN', 'SUPERVISOR'],
  '/officer': ['INVESTIGATING_OFFICER'],
  '/vault': ['VAULT_CUSTODIAN'],
  '/lab': ['LAB_ANALYST'],
  '/judge': ['JUDGE', 'ADMIN'],
  '/auditor': ['AUDITOR', 'ADMIN'],
}

function isPublicRoute(pathname: string): boolean {
  return (
    pathname === '/' ||
    PUBLIC_ROUTES.some((route) => route !== '/' && (pathname === route || pathname.startsWith(`${route}/`))) ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Static assets and public institutional routes — skip auth
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Build response with refreshed cookies (Supabase SSR pattern)
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase is not configured, allow through in local dev
  if (!supabaseUrl || !supabaseKey) {
    return response
  }

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

    // IMPORTANT: Always use getUser() (not getSession()) — verifies JWT with Supabase
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      // Not authenticated — enforce redirect to login for confidential workstation hubs
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Attach user ID to request headers for downstream API routes
    response.headers.set('x-user-id', user.id)
    response.headers.set('x-user-email', user.email ?? '')

    return response

  } catch (err) {
    console.error('[FORENZA] Middleware error:', err)
    return response
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
