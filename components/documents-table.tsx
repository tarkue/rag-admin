"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FileStack,
  FileText,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  courseFilterValue,
  matchesCourse,
  formatPublicationDate,
} from "@/lib/validation";
import type { DocumentRecord } from "@/lib/types";
import { removeDocument, reindexDocuments } from "@/app/actions/rag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UploadDialog } from "@/components/upload-dialog";
import { RefreshButton } from "@/components/refresh-button";
const PAGE_SIZE = 10;
export function DocumentsTable({
  documents,
  unavailable,
}: {
  documents: DocumentRecord[];
  unavailable: boolean;
}) {
  const [search, setSearch] = useState("");
  const [course, setCourse] = useState("all");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<DocumentRecord | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const courses = useMemo(
    () => [...new Set(documents.map((doc) => doc.course_id))].sort(),
    [documents],
  );
  const filtered = useMemo(
    () =>
      documents.filter(
        (doc) =>
          matchesCourse(course, doc.course_id) &&
          [doc.title, doc.filename, doc.doc_id, doc.author, ...doc.keywords]
            .join(" ")
            .toLocaleLowerCase()
            .includes(search.toLocaleLowerCase()),
      ),
    [documents, search, course],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  function run(doc: DocumentRecord, remove = false) {
    setBusyId(doc.doc_id);
    startTransition(async () => {
      try {
        const result = remove
          ? await removeDocument(doc.doc_id)
          : await reindexDocuments([doc.doc_id]);
        if (result.ok) {
          toast.success(result.message);
          setDeleting(null);
          router.refresh();
        } else toast.error(result.message);
      } catch {
        toast.error("Не удалось выполнить действие. Попробуйте ещё раз.");
      } finally {
        setBusyId(null);
      }
    });
  }
  return (
    <section className="panel documents-table-panel">
      <div className="documents-toolbar">
        <div className="search-field">
          <Search size={17} />
          <Input
            aria-label="Поиск документов"
            placeholder="Найти документ, автора или ключевое слово…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
          {search && (
            <button aria-label="Очистить поиск" onClick={() => setSearch("")}>
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={course}
            onValueChange={(value) => {
              setCourse(value);
              setPage(1);
            }}
          >
            <SelectTrigger aria-label="Фильтр по курсу" className="w-44">
              <SelectValue placeholder="Все курсы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все курсы</SelectItem>
              {courses.map((id) => (
                <SelectItem value={courseFilterValue(id)} key={id}>
                  {id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <RefreshButton />
        </div>
      </div>
      <div className="documents-summary">
        <span>
          Все документы <Badge variant="secondary">{filtered.length}</Badge>
        </span>
        <span>Материалы доступны только в рамках своего курса</span>
      </div>
      {visible.length ? (
        <div className="table-scroll">
          <table className="documents-table">
            <thead>
              <tr>
                <th>Документ</th>
                <th>Курс</th>
                <th>Фрагменты</th>
                <th>Источник</th>
                <th>Дата публикации</th>
                <th className="w-12">
                  <span className="sr-only">Действия</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((doc) => (
                <tr key={doc.doc_id}>
                  <td>
                    <div className="table-document">
                      <span className="document-type-icon">
                        <FileText size={20} />
                      </span>
                      <div>
                        <strong title={doc.title}>
                          {doc.title || doc.filename || doc.doc_id}
                        </strong>
                        <span>
                          {doc.author || "Без автора"}{" "}
                          <span className="text-muted-foreground/50">·</span>{" "}
                          {doc.doc_id}
                        </span>
                        {doc.keywords.length > 0 && (
                          <div className="document-tags">
                            {doc.keywords.slice(0, 3).map((word, index) => (
                              <span key={`${word}-${index}`}>{word}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge variant="outline" className="font-normal">
                      {doc.course_id}
                    </Badge>
                  </td>
                  <td>
                    <span className="chunk-count">{doc.chunks}</span>
                  </td>
                  <td>
                    <span
                      className={
                        doc.reindexable ? "source-moodle" : "source-upload"
                      }
                    >
                      <span />
                      {doc.reindexable ? "Moodle" : "Загрузка"}
                    </span>
                  </td>
                  <td className="date-cell">
                    {formatPublicationDate(doc.publish_date)}
                  </td>
                  <td>
                    {pending && busyId === doc.doc_id ? (
                      <Loader2
                        size={17}
                        className="animate-spin text-primary"
                      />
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Действия: ${doc.title || doc.doc_id}`}
                            disabled={pending}
                          >
                            <MoreHorizontal size={18} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>
                            Управление документом
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            disabled={!doc.reindexable}
                            onSelect={() => run(doc)}
                          >
                            <RefreshCw size={15} />
                            Переиндексировать
                          </DropdownMenuItem>
                          {!doc.reindexable && (
                            <p className="max-w-60 px-2 py-1 text-xs text-muted-foreground">
                              Для обновления загрузите файл повторно с ID:{" "}
                              {doc.doc_id}
                            </p>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => setDeleting(doc)}
                          >
                            <Trash2 size={15} />
                            Удалить документ
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-panel">
          <span className="empty-icon">
            <FileStack size={30} strokeWidth={1.4} />
          </span>
          <h2>
            {unavailable
              ? "Нет соединения с базой"
              : search || course !== "all"
                ? "Ничего не найдено"
                : "Здесь будут ваши документы"}
          </h2>
          <p>
            {unavailable
              ? "Проверьте подключение к RAG-сервису и обновите данные."
              : search || course !== "all"
                ? "Попробуйте другое название или выберите другой курс."
                : "Добавьте материалы курса, чтобы ассистент мог находить в них ответы."}
          </p>
          {!unavailable && !search && course === "all" && <UploadDialog />}
          {(search || course !== "all") && (
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setCourse("all");
              }}
            >
              Сбросить фильтры
            </Button>
          )}
        </div>
      )}
      <div className="table-footer">
        <span>
          {filtered.length
            ? `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filtered.length)} из ${filtered.length} документов`
            : "0 документов"}
        </span>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            Назад
          </Button>
          <span>
            {currentPage} / {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage >= pages}
          >
            Далее
          </Button>
        </div>
      </div>
      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(value) => {
          if (!value && !pending) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить документ?</AlertDialogTitle>
            <AlertDialogDescription>
              «{deleting?.title || deleting?.doc_id}» и все его фрагменты будут
              удалены из поискового индекса. При необходимости файл можно
              загрузить снова.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={pending}
              onClick={(event) => {
                event.preventDefault();
                if (deleting) run(deleting, true);
              }}
            >
              {pending && <Loader2 size={15} className="animate-spin" />}Удалить
              документ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
