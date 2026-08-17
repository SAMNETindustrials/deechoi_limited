import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 1. Safe environment variable retrieval with fallbacks
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

  // If real Supabase keys are not set, allow requests through without crashing
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl.includes('placeholder')) {
    return response
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    })

    // Refresh auth token safely
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Protected Admin Routes: /admin/* (except /admin/login)
    const pathname = request.nextUrl.pathname
    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
      if (!user) {
        const loginUrl = new URL('/admin/login', request.url)
        return NextResponse.redirect(loginUrl)
      }
    }
  } catch (error) {
    // Prevent unhandled Edge Runtime exceptions from throwing a 500 error
    console.warn('[Middleware Error]:', error)
  }

  return response
}

// 2. Strict matcher to exclude static assets, images, icons, and favicon
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, audio, video like .png, .jpg, .mp4, .svg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|ico)$).*)',
  ],
}