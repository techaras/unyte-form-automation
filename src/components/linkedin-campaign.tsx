'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { LinkedInAdAccount } from '@/components/linkedin-ad-account'
import { LinkedInCampaignGroups } from '@/components/linkedin-campaign-groups'
import { LinkedInCreateAdCampaign } from '@/components/linkedin-create-ad-campaign'
import { LinkedInCreateCampaignGroup } from '@/components/create-linkedin-campaign-group'
import { getLinkedInAdAccounts, LinkedInAdAccount as AdAccountType } from '@/app/actions/linkedin-ad-accounts'
import { getLinkedInCampaignGroups, LinkedInCampaignGroup } from '@/app/actions/linkedin-campaign-groups'
import { toast } from 'sonner'

// Define interfaces for form data
interface FormQuestion {
  question: string;
  answer: string;
}

interface StructuredData {
  rawText: string;
  formData: FormQuestion[];
}

interface LinkedInCampaignProps {
  id: string
  onRemove: (id: string) => void
  organizationId: string
  formData?: StructuredData // Add formData prop
}

export function LinkedInCampaign({ id, onRemove, organizationId, formData }: LinkedInCampaignProps) {
  const [accounts, setAccounts] = useState<AdAccountType[]>([])
  const [campaignGroups, setCampaignGroups] = useState<LinkedInCampaignGroup[]>([])
  
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [selectedCampaignGroup, setSelectedCampaignGroup] = useState<string>('')

  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true)
  const [isLoadingCampaignGroups, setIsLoadingCampaignGroups] = useState(false)
  
  const [accountsError, setAccountsError] = useState<string | null>(null)
  const [campaignGroupsError, setCampaignGroupsError] = useState<string | null>(null)

  // Fetch LinkedIn ad accounts when component mounts
  useEffect(() => {
    async function fetchAdAccounts() {
      try {
        setIsLoadingAccounts(true)
        setAccountsError(null)
        
        const result = await getLinkedInAdAccounts(organizationId)
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch LinkedIn ad accounts')
        }
        
        setAccounts(result.data || [])
      } catch (error) {
        console.error('Error fetching LinkedIn ad accounts:', error)
        setAccountsError(error instanceof Error ? error.message : 'Failed to fetch ad accounts')
        toast.error('Failed to fetch LinkedIn ad accounts', {
          description: error instanceof Error ? error.message : 'An unexpected error occurred'
        })
      } finally {
        setIsLoadingAccounts(false)
      }
    }
    
    fetchAdAccounts()
  }, [organizationId])

  // Fetch campaign groups when an ad account is selected
  useEffect(() => {
    async function fetchCampaignGroups() {
      if (!selectedAccount) {
        setCampaignGroups([])
        setSelectedCampaignGroup('')
        return
      }

      try {
        setIsLoadingCampaignGroups(true)
        setCampaignGroupsError(null)
        
        const result = await getLinkedInCampaignGroups(organizationId, selectedAccount)
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch LinkedIn campaign groups')
        }
        
        setCampaignGroups(result.data || [])
      } catch (error) {
        console.error('Error fetching LinkedIn campaign groups:', error)
        setCampaignGroupsError(error instanceof Error ? error.message : 'Failed to fetch campaign groups')
        toast.error('Failed to fetch LinkedIn campaign groups', {
          description: error instanceof Error ? error.message : 'An unexpected error occurred'
        })
      } finally {
        setIsLoadingCampaignGroups(false)
      }
    }
    
    fetchCampaignGroups()
  }, [organizationId, selectedAccount])

  // Handle ad account selection
  const handleAdAccountChange = (value: string) => {
    setSelectedAccount(value)
    // Reset dependent selections
    setSelectedCampaignGroup('')
    setCampaignGroups([])
  }

  // Handle campaign group selection
  const handleCampaignGroupChange = (value: string) => {
    setSelectedCampaignGroup(value)
  }

  // Handle when a new campaign group is created
  const handleCampaignGroupCreated = async (newCampaignGroup: { id: string; name: string }) => {
    console.log('New campaign group created:', newCampaignGroup)
    
    // Refresh campaign groups list to include the new one
    try {
      const result = await getLinkedInCampaignGroups(organizationId, selectedAccount)
      
      if (result.success && result.data) {
        setCampaignGroups(result.data)
        // Automatically select the newly created campaign group
        setSelectedCampaignGroup(newCampaignGroup.id)
      }
    } catch (error) {
      console.error('Error refreshing campaign groups after creation:', error)
      toast.error('Failed to refresh campaign groups', {
        description: 'Please refresh the page to see the new campaign group'
      })
    }
  }

  // Handle when a new campaign is created
  const handleCampaignCreated = async (newCampaign: { id: string; name: string }) => {
    console.log('New campaign created:', newCampaign)
    // Campaign creation completed successfully
  }

  return (
    <Card className="mb-4 relative">
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-2 right-2 h-6 w-6" 
        onClick={() => onRemove(id)}
      >
        <X className="h-4 w-4" />
      </Button>
      <CardHeader>
        <CardTitle>LinkedIn</CardTitle>
        <CardDescription>Create a campaign for LinkedIn</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ad Account Selection */}
        {accountsError ? (
          <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400">
            <p className="text-sm">{accountsError}</p>
          </div>
        ) : (
          <LinkedInAdAccount 
            accounts={accounts} 
            onChange={handleAdAccountChange}
            isLoading={isLoadingAccounts}
          />
        )}

        {/* Campaign Group Selection */}
        {campaignGroupsError ? (
          <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400">
            <p className="text-sm">{campaignGroupsError}</p>
          </div>
        ) : (
          <LinkedInCampaignGroups
            campaignGroups={campaignGroups}
            onChange={handleCampaignGroupChange}
            isLoading={isLoadingCampaignGroups}
          />
        )}

        {/* Create New Campaign Group Component - now with formData */}
        <LinkedInCreateCampaignGroup
          organizationId={organizationId}
          selectedAccount={selectedAccount}
          onCampaignGroupCreated={handleCampaignGroupCreated}
          formData={formData}
        />

        {/* Create New Campaign Component - now with formData */}
        <LinkedInCreateAdCampaign
          organizationId={organizationId}
          selectedAccount={selectedAccount}
          selectedCampaignGroup={selectedCampaignGroup}
          onCampaignCreated={handleCampaignCreated}
          formData={formData}
        />
      </CardContent>
    </Card>
  )
}