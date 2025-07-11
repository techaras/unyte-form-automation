import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { exchangeTikTokToken } from '@/app/actions/tiktok-token'

export async function GET(request: NextRequest) {
  try {
    // Get URL parameters
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    
    // For debugging: Log all the parameters we received
    console.log('TikTok Callback Parameters:', {
      code: code ? 'present' : 'missing',
      state,
      error,
      errorDescription,
      allParams: Object.fromEntries(searchParams.entries())
    })
    
    // Production URL - always use this instead of localhost
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://app.unyte.ai' 
      : 'http://localhost:3000'
    
    // If there's an error, redirect to the error page
    if (error) {
      console.error('TikTok auth error:', error, errorDescription)
      return NextResponse.redirect(
        `${baseUrl}/auth/error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}`
      )
    }
    
    // Verify state parameter to prevent CSRF attacks
    const cookieStore = await cookies()
    const storedState = cookieStore.get('tiktok_csrf_state')?.value
    
    if (!storedState || storedState !== state) {
      console.error('State mismatch! Possible CSRF attack.')
      return NextResponse.redirect(
        `${baseUrl}/auth/error?error=Invalid state parameter`
      )
    }
    
    // If code or state is missing, handle the error
    if (!code || !state) {
      console.error('Authorization code or state is missing from callback')
      return NextResponse.redirect(
        `${baseUrl}/auth/error?error=Missing required parameters`
      )
    }
    
    // Extract organization ID from state (like LinkedIn)
    // Format: randomUUID__organizationId (using double underscore as delimiter)
    const stateParts = state.split('__')
    
    if (stateParts.length !== 2) {
      console.error('Invalid state format, missing organization ID')
      return NextResponse.redirect(
        `${baseUrl}/auth/error?error=Invalid state parameter format`
      )
    }
    
    // Get the organization ID (the part after the delimiter)
    const organizationId = stateParts[1]
    
    // Exchange code for tokens
    const result = await exchangeTikTokToken(code, organizationId)
    
    if (!result.success) {
      // If token exchange failed, redirect to error page
      return NextResponse.redirect(
        `${baseUrl}/auth/error?error=${encodeURIComponent(result.error || 'Failed to exchange token')}`
      )
    }
    
    // Successful connection, redirect to organization page with success message
    return NextResponse.redirect(
      `${baseUrl}/home/${organizationId}?tiktok=connected&success=1`
    )
    
  } catch (error) {
    console.error('Error in TikTok callback handler:', error)
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://app.unyte.ai' 
      : 'http://localhost:3000'
      
    return NextResponse.redirect(
      `${baseUrl}/auth/error?error=${encodeURIComponent('Unexpected error processing TikTok callback')}`
    )
  }
}