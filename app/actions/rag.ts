"use server";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import {
  validatePrompt,
  validateDocumentId,
  validateRemovalId,
} from "@/lib/validation";
import { backend } from "@/lib/backend";
import type { ActionResult, ConfigPatch } from "@/lib/types";

function failure(error: unknown): ActionResult {
  return {
    ok: false,
    message:
      error instanceof Error ? error.message : "Не удалось выполнить действие.",
  };
}
function refreshDocuments() {
  revalidatePath("/");
  revalidatePath("/documents");
}
export async function uploadDocument(form: FormData): Promise<ActionResult> {
  await requireSession();
  const file = form.get("file");
  const courseId = String(form.get("course_id") || "").trim();
  if (!(file instanceof File) || !file.size)
    return { ok: false, message: "Выберите документ." };
  if (!/\.(pdf|docx|pptx)$/i.test(file.name))
    return { ok: false, message: "Поддерживаются PDF, DOCX и PPTX." };
  if (file.size > 30 * 1024 * 1024)
    return { ok: false, message: "Максимальный размер файла — 30 МБ." };
  if (!courseId) return { ok: false, message: "Укажите ID курса." };
  const documentId =
    String(form.get("doc_id") || "").trim() || crypto.randomUUID();
  const idError = validateDocumentId(documentId);
  if (idError) return { ok: false, message: idError };
  const query = new URLSearchParams({
    doc_id: documentId,
    course_id: courseId,
    title: String(form.get("title") || "").trim() || file.name,
    author: String(form.get("author") || "").trim(),
  });
  const date = String(form.get("publish_date") || "");
  if (date) query.set("publish_date", date);
  String(form.get("keywords") || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean)
    .forEach((k) => query.append("keywords", k));
  const body = new FormData();
  body.set("file", file);
  try {
    const result = await backend<{ chunks: number }>(
      `/ingest/file?${query}`,
      { method: "POST", body },
      "service",
      300_000,
    );
    refreshDocuments();
    return {
      ok: true,
      message: `Документ добавлен. Фрагментов в индексе: ${result.chunks}.`,
    };
  } catch (error) {
    return failure(error);
  }
}
export async function removeDocument(docId: string): Promise<ActionResult> {
  await requireSession();
  const idError = validateRemovalId(docId);
  if (idError) return { ok: false, message: idError };
  try {
    await backend(
      `/ingest/${encodeURIComponent(docId)}`,
      { method: "DELETE" },
      "service",
    );
    refreshDocuments();
    return { ok: true, message: "Документ удалён из базы знаний." };
  } catch (error) {
    return failure(error);
  }
}
export async function reindexDocuments(
  docIds: string[],
): Promise<ActionResult> {
  await requireSession();
  if (!docIds.length)
    return { ok: false, message: "Выберите документы для переиндексации." };
  try {
    const result = await backend<{ results: { status: string }[] }>(
      "/reindex",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_ids: docIds }),
      },
      "admin",
      300_000,
    );
    refreshDocuments();
    const failed = result.results.filter(
      (item) => item.status !== "indexed",
    ).length;
    if (failed)
      return {
        ok: false,
        message: `Не удалось переиндексировать документов: ${failed}. Для ручных загрузок загрузите файл повторно с прежним ID.`,
      };
    return { ok: true, message: "Индекс обновлён." };
  } catch (error) {
    return failure(error);
  }
}
export async function saveConfig(patch: ConfigPatch): Promise<ActionResult> {
  await requireSession();
  if (patch.RAG_PROMPT !== undefined) {
    const promptError = validatePrompt(patch.RAG_PROMPT);
    if (promptError) return { ok: false, message: promptError };
  }
  try {
    const result = await backend<{ reindex_required: boolean }>("/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    revalidatePath("/settings");
    revalidatePath("/");
    return {
      ok: true,
      message: "Настройки сохранены.",
      reindexRequired: result.reindex_required,
    };
  } catch (error) {
    return failure(error);
  }
}
