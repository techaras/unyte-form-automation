import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card'
import { Metadata } from 'next'

  export const metadata: Metadata = {
    title: 'Sign Up Success',
    description: 'Thank you for signing up! Please check your email to confirm your account.',
  }
  
  export default function Page() {
    return (
      <div className="flex w-full items-center justify-center">
        <div className="w-full max-w-sm">
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Thank you for signing up!</CardTitle>
                <CardDescription>Check your email to confirm</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  You&apos;ve successfully signed up. Please check your email to confirm your account
                  before signing in.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }