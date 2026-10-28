"use client";
import { useActionState, useState } from "react";
import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, { error: "" });
  const [showPassword, setShowPassword] = useState(false);
  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="login">Логин</Label>
        <Input
          id="login"
          name="login"
          placeholder="Введите ваш логин"
          autoComplete="username"
          required
          maxLength={200}
          className="h-12"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Пароль</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Введите пароль"
            autoComplete="current-password"
            required
            maxLength={500}
            className="h-12 pr-12"
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </div>
      {state.error && (
        <p
          role="alert"
          className="rounded-lg bg-destructive/8 p-3 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}
      <Button className="h-12 w-full text-sm" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        {pending ? "Входим…" : "Войти в пространство"}
        {!pending && <ArrowRight className="ml-auto" size={17} />}
      </Button>
    </form>
  );
}
