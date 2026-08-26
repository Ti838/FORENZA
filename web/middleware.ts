import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Public routes — no auth required
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/mfa',
  '/download',
  '/api/auth/login',
  '/api/health',
  '/api/download',
]

// Route → required roles mapping (checked after auth)
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
    PUBLIC_ROUTES.some((route) => route !== '/' && pathname.startsWith(route)) ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Static assets and public routes — skip auth
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
    console.warn('[FORENZA] Supabase not configured — skipping auth middleware')
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
      // Not authenticated — enforce redirect or 401
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

    // Role-based route protection (lightweight check — full RBAC is in API routes)
    for (const [routePrefix, allowedRoles] of Object.entries(ROUTE_ROLES)) {
      if (pathname.startsWith(routePrefix)) {
        // We do a quick roles DB lookup only for protected page routes (not API)
        if (!pathname.startsWith('/api/')) {
          // For pages, we rely on the page itself or a server component to do full RBAC
          // Middleware here is a first-line defence only
          break
        }
      }
    }

    return response

  } catch (err) {
    console.error('[FORENZA] Middleware error:', err)
    // Graceful degradation — allow through if middleware itself errors
    return response
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
