import { Suspense } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { NewPasswordForm } from "@/features/auth/components/new-password-form"

export default function NuevaClavePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Nueva contraseña</CardTitle>
          <CardDescription>Elige una contraseña segura para tu cuenta.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-6">
                <div className="size-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
              </div>
            }
          >
            <NewPasswordForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
