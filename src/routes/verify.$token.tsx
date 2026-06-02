import { createFileRoute } from '@tanstack/react-router'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { API_BASE } from '@/lib/api'

export const Route = createFileRoute('/verify/$token')({
  component: VerifyTokenComponent,
})

function VerifyTokenComponent() {
  const { token } = Route.useParams()

  const { data, isLoading } = useQuery({
    queryKey: ['verify', token],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/verify/${token}`)
      if (!res.ok) throw new Error('Network error')
      return res.json()
    },
  })

  if (isLoading) {
    return <div className="flex p-10 justify-center">Verifying...</div>
  }

  const isValid = data?.valid

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6 bg-slate-50">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            {isValid ? (
              <CheckCircle2 className="h-20 w-20 text-green-500" />
            ) : (
              <XCircle className="h-20 w-20 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {isValid ? 'Certificate Verified' : 'Verification Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isValid ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-muted-foreground">Recipient</span>
                <span className="font-medium text-lg">{data.recipient || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-muted-foreground">Template</span>
                <span className="font-medium">{data.template_name}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-muted-foreground">Issued At</span>
                <span className="font-medium">
                  {new Date(data.issued_at).toLocaleString()}
                </span>
              </div>
              <div className="pt-4 flex justify-center">
                <Badge variant="secondary" className="px-4 py-1 text-sm bg-green-100 text-green-800 hover:bg-green-100">
                  Authentic Record
                </Badge>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              <p>We could not find a valid certificate matching this token.</p>
              <p className="mt-2">The certificate may have been deleted, or the QR code is invalid.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
