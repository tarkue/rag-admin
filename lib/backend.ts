import "server-only";
import { requireSession } from "@/lib/auth";
import type { DocumentRecord, Health, RagConfig, Resource } from "@/lib/types";

export class BackendError extends Error {}
export async function backend<T>(
  path: string,
  init: RequestInit = {},
  token: "admin" | "service" | "none" = "admin",
  timeout = 15_000,
): Promise<T> {
  await requireSession();
  const baseUrl = process.env.RAG_API_URL || "http://127.0.0.1:8000";
  const headers = new Headers(init.headers);
  if (token === "admin")
    headers.set("X-Admin-Token", process.env.RAG_ADMIN_TOKEN || "");
  if (token === "service")
    headers.set("X-Service-Token", process.env.RAG_SERVICE_TOKEN || "");
  let response: Response;
  try {
    response = await fetch(`${baseUrl.replace(/\/$/, "")}/api${path}`, {
      ...init,
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(timeout),
    });
  } catch {
    throw new BackendError(
      "Не удалось подключиться к RAG-сервису. Проверьте, что FastAPI запущен.",
    );
  }
  if (!response.ok) {
    if (response.status === 401)
      throw new BackendError(
        "Серверный токен не подходит. Проверьте RAG_ADMIN_TOKEN и RAG_SERVICE_TOKEN в .env.local.",
      );
    if (response.status === 503)
      throw new BackendError("Административный API не настроен на сервере.");
    if (response.status === 422) {
      const body = await response.json().catch(() => ({}));
      const detail =
        typeof body.detail === "string"
          ? body.detail
          : "Проверьте значения полей.";
      throw new BackendError(`Настройки не сохранены: ${detail}`);
    }
    throw new BackendError(
      `RAG-сервис вернул ошибку ${response.status}. Подробности доступны в его логах.`,
    );
  }
  return response.json() as Promise<T>;
}
export async function resource<T>(
  load: () => Promise<T>,
): Promise<Resource<T>> {
  try {
    return { value: await load(), error: null };
  } catch (error) {
    return {
      value: null,
      error:
        error instanceof Error ? error.message : "Не удалось загрузить данные.",
    };
  }
}
export const getDocuments = () => backend<DocumentRecord[]>("/documents");
export const getHealth = () => backend<Health>("/health", {}, "none");
export async function getConfig() {
  return (await backend<{ config: RagConfig }>("/config")).config;
}
