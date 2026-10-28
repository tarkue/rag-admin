"use server";
import { createSession, deleteSession, verifyCredentials } from "@/lib/auth";
import { redirect } from "next/navigation";

const loginAttempts = globalThis as typeof globalThis & {
  ragLoginLimit?: { attempts: number; resetAt: number };
};
export async function loginAction(
  _state: { error: string },
  formData: FormData,
) {
  const now = Date.now();
  const limit = loginAttempts.ragLoginLimit;
  if (limit && limit.resetAt > now && limit.attempts >= 8) {
    return { error: "Слишком много попыток. Попробуйте через минуту." };
  }
  const login = String(formData.get("login") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (login.length > 200 || password.length > 500)
    return { error: "Неверный логин или пароль." };
  try {
    if (!verifyCredentials(login, password)) {
      const active =
        limit && limit.resetAt > now
          ? limit
          : { attempts: 0, resetAt: now + 60_000 };
      loginAttempts.ragLoginLimit = {
        ...active,
        attempts: active.attempts + 1,
      };
      return { error: "Неверный логин или пароль." };
    }
    await createSession();
    loginAttempts.ragLoginLimit = undefined;
  } catch (error) {
    console.error(
      "Login configuration error:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return {
      error:
        "Вход пока не настроен. Проверьте переменные окружения на сервере.",
    };
  }
  redirect("/");
}
export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
