"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Plus, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { uploadDocument } from "@/app/actions/rag";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateDocumentId } from "@/lib/validation";
import { cn } from "@/lib/utils";
export function UploadDialog({
  label = "Загрузить документ",
  variant = "default",
}: {
  label?: string;
  variant?: "default" | "outline";
}) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pending, startTransition] = useTransition();
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  function selectFile(selected?: File) {
    if (input.current) input.current.value = "";
    if (!selected) return;
    if (!/\.(pdf|docx|pptx)$/i.test(selected.name)) {
      toast.error("Выберите PDF, DOCX или PPTX.");
      return;
    }
    if (selected.size > 30 * 1024 * 1024) {
      toast.error("Максимальный размер — 30 МБ.");
      return;
    }
    setFile(selected);
  }
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      toast.error("Сначала выберите файл.");
      return;
    }
    const form = new FormData(event.currentTarget);
    form.set("file", file);
    const documentId = String(form.get("doc_id") || "").trim();
    const idError = documentId ? validateDocumentId(documentId) : null;
    if (idError) {
      toast.error(idError);
      return;
    }
    startTransition(async () => {
      try {
        const result = await uploadDocument(form);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        toast.success(result.message);
        setOpen(false);
        setFile(null);
        router.refresh();
      } catch {
        toast.error(
          "Загрузка прервана. Обновите страницу и попробуйте ещё раз.",
        );
      }
    });
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!pending) setOpen(value);
      }}
    >
      <DialogTrigger asChild>
        <Button variant={variant}>
          <Plus size={16} />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-0 max-h-[calc(100dvh-2rem)] overflow-x-hidden overflow-y-auto bg-white sm:max-w-xl">
        <DialogHeader className="min-w-0">
          <span className="dialog-icon">
            <UploadCloud size={23} />
          </span>
          <DialogTitle className="text-xl">Добавить знания</DialogTitle>
          <DialogDescription>
            Загрузите материал, который ассистент сможет использовать в ответах.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="min-w-0 space-y-5">
          <fieldset
            disabled={pending}
            className="min-w-0 space-y-5 disabled:opacity-60"
          >
            <input
              ref={input}
              type="file"
              accept=".pdf,.docx,.pptx"
              className="sr-only"
              tabIndex={-1}
              aria-label="Выберите документ"
              onChange={(event) => selectFile(event.target.files?.[0])}
            />
            <div
              className={cn(
                "upload-dropzone",
                dragging && "upload-dropzone-active",
              )}
              onDragOver={(event) => {
                event.preventDefault();
                if (!pending) setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                if (!pending) selectFile(event.dataTransfer.files[0]);
              }}
            >
              {file ? (
                <div className="selected-file">
                  <span className="file-icon">
                    <FileText size={23} />
                  </span>
                  <div>
                    <strong>{file.name}</strong>
                    <span>
                      {(file.size / 1024 / 1024).toFixed(2)} МБ · готов к
                      загрузке
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Убрать выбранный файл"
                    onClick={() => setFile(null)}
                  >
                    <X size={16} />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  className="dropzone-button"
                  onClick={() => input.current?.click()}
                >
                  <UploadCloud size={30} strokeWidth={1.4} />
                  <strong>Перетащите документ сюда</strong>
                  <span>
                    или <em>выберите файл</em> на компьютере
                  </span>
                  <small>PDF, DOCX, PPTX · до 30 МБ</small>
                </button>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="course_id">
                  ID курса <span className="text-primary">*</span>
                </Label>
                <Input
                  id="course_id"
                  name="course_id"
                  placeholder="Например, course-101"
                  required
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">Автор</Label>
                <Input
                  id="author"
                  name="author"
                  placeholder="Имя преподавателя"
                  maxLength={200}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Название документа</Label>
              <Input
                id="title"
                name="title"
                placeholder={file?.name || "Если пусто — используем имя файла"}
                maxLength={300}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="publish_date">Дата публикации</Label>
                <Input id="publish_date" name="publish_date" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keywords">Ключевые слова</Label>
                <Input
                  id="keywords"
                  name="keywords"
                  placeholder="лекция, введение"
                  maxLength={1000}
                />
              </div>
            </div>
            <details className="advanced-upload">
              <summary>
                ID документа <span>для повторной загрузки</span>
              </summary>
              <Input
                name="doc_id"
                placeholder="Оставьте пустым для нового документа"
                maxLength={200}
                className="mt-3"
              />
              <p>Прежний ID заменит документ и обновит его индекс.</p>
            </details>
          </fieldset>
          <div className="dialog-footer">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Отмена
            </Button>
            <Button disabled={pending || !file} type="submit">
              {pending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <UploadCloud size={16} />
              )}{" "}
              {pending ? "Индексируем…" : "Загрузить и индексировать"}
            </Button>
          </div>
          {pending && (
            <p
              role="status"
              className="text-xs leading-relaxed text-muted-foreground"
            >
              Первая индексация может занять несколько минут: сервис загружает
              модель эмбеддингов. Не закрывайте окно.
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
