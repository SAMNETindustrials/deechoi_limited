import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      )
    }

    // Get Supabase configuration
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[v0] Missing Supabase config')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Check if admin already exists
    try {
      const checkUrl = `${supabaseUrl}/rest/v1/admin_users?email=eq.${encodeURIComponent(email)}&select=id`
      const checkRes = await fetch(checkUrl, {
        method: 'GET',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
      })
      
      const existing = await checkRes.json()
      if (Array.isArray(existing) && existing.length > 0) {
        return NextResponse.json(
          { message: 'Super admin already exists', email },
          { status: 200 }
        )
      }
    } catch (e) {
      console.log('[v0] Check admin query:', e)
    }

    // Create auth user
    const authUrl = `${supabaseUrl}/auth/v1/admin/users`
    const authRes = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
      }),
    })

    if (!authRes.ok) {
      const error = await authRes.json()
      console.error('[v0] Auth creation failed:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to create account' },
        { status: 400 }
      )
    }

    const authData = await authRes.json()
    const userId = authData.user?.id

    if (!userId) {
      console.error('[v0] No user ID returned')
      return NextResponse.json(
        { error: 'Failed to get user ID' },
        { status: 400 }
      )
    }

    // Create admin profile
    const adminUrl = `${supabaseUrl}/rest/v1/admin_users`
    const adminRes = await fetch(adminUrl, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        id: userId,
        email,
        role: 'super_admin',
        status: 'active',
      }),
    })

    if (!adminRes.ok) {
      const error = await adminRes.json()
      console.error('[v0] Admin profile creation failed:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to create admin profile' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        message: 'Super admin created successfully',
        user: {
          id: userId,
          email,
          role: 'super_admin',
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[v0] Setup error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
