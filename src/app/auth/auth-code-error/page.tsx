// calorie-counter/src/app/auth/auth-code-error/page.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthCodeError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-red-600">
            Authentication Error
          </CardTitle>
          <CardDescription>
            Sorry, we couldn't authenticate you. This could be due to an expired link or invalid code.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4 text-sm text-gray-600">
            Please try signing in again or contact support if the problem persists.
          </p>
          <Button asChild>
            <Link href="/login">
              Back to Login
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}