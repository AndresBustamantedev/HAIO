"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { signIn } from "@/features/auth/actions/sign-in"
import { loginSchema, type LoginInput } from "@/features/auth/schemas/login-schema"

function LoginForm() {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  function onSubmit(values: LoginInput) {
    startTransition(async () => {
      const result = await signIn(values)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Sesión iniciada.")
      router.push("/")
      router.refresh()
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl render={<Input type="email" placeholder="tucorreo@haio.dev" autoComplete="email" {...field} />} />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl render={<Input type="password" autoComplete="current-password" {...field} />} />
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending} className="mt-2 w-full">
          {isPending ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </Form>
  )
}

export { LoginForm }
