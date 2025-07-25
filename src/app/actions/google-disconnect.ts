'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

/**
 * Disconnects a user's Google account by revoking their token
 * and removing the connection from the database
 */
export async function disconnectGoogle(organizationId: string): Promise<{ 
  success: boolean; 
  error?: string;
}> {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Get the Google connection information - include both tokens
    const { data: connection, error } = await supabase
      .from('google_connections')
      .select('id, access_token, refresh_token')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single()
    
    if (error || !connection) {
      throw new Error('Google connection not found')
    }

    // Attempt to revoke the token with Google
    // Prioritize refresh_token as it's more reliable for revocation
    const tokenToRevoke = connection.refresh_token || connection.access_token
    
    if (tokenToRevoke) {
      try {
        // Use Google's OAuth2 token revocation endpoint
        const response = await fetch('https://oauth2.googleapis.com/revoke', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            token: tokenToRevoke
          }).toString()
        })
        
        // Log but don't fail if token revocation fails
        if (!response.ok) {
          const errorText = await response.text()
          console.warn('Google token revocation may have failed:', errorText)
        } else {
          console.log('Google token revoked successfully')
        }
      } catch (revokeError) {
        // Log but continue - we still want to remove from our database
        console.warn('Error revoking Google token:', revokeError)
      }
    } else {
      console.warn('No token available for revocation')
    }
    
    // Delete the connection from the database
    const { error: deleteError } = await adminClient
      .from('google_connections')
      .delete()
      .eq('id', connection.id)
    
    if (deleteError) {
      throw new Error(`Error deleting Google connection: ${deleteError.message}`)
    }
    
    // Revalidate relevant paths to update UI
    revalidatePath(`/home/${organizationId}`)
    
    return { success: true }
  } catch (error) {
    console.error('Error disconnecting Google:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}