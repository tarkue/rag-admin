/** Mirrors the Python format fields supported by the RAG backend. */
export function validatePrompt(prompt: string): string | null {
  const fields = new Set<string>();
  for (let index = 0; index < prompt.length; index++) {
    const character = prompt[index];
    if (character !== "{" && character !== "}") continue;
    if (prompt[index + 1] === character) {
      index++;
      continue;
    }
    if (character === "}")
      return "Лишняя закрывающая скобка в промпте. Для обычных скобок используйте {{ и }}.";
    const end = prompt.indexOf("}", index + 1);
    if (end === -1) return "В промпте есть незакрытая фигурная скобка.";
    const field = prompt.slice(index + 1, end);
    if (field !== "context" && field !== "query")
      return "В промпте разрешены только {context} и {query}. Обычные скобки экранируйте: {{ и }}.";
    fields.add(field);
    index = end;
  }
  return fields.has("context") && fields.has("query")
    ? null
    : "Добавьте в промпт обе переменные: {context} и {query}.";
}
export function validateDocumentId(id: string): string | null {
  if (
    !id ||
    id.length > 200 ||
    id === "." ||
    id === ".." ||
    /[\\/\u0000-\u001f\u007f]/.test(id)
  ) {
    return "ID документа: от 1 до 200 символов, без /, \\ и служебных символов. Значения . и .. запрещены.";
  }
  return null;
}
export function courseFilterValue(courseId: string): string {
  return `course:${courseId}`;
}
export function matchesCourse(filter: string, courseId: string): boolean {
  return filter === "all" || filter === courseFilterValue(courseId);
}
export function formatPublicationDate(value: string | null): string {
  if (!value) return "Не указана";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Не указана";
  return new Intl.DateTimeFormat("ru", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** Existing Moodle IDs are not restricted by the manual-upload length limit. */
export function validateRemovalId(id: string): string | null {
  if (
    typeof id !== "string" ||
    !id ||
    id.includes("/") ||
    id === "." ||
    id === ".."
  ) {
    return "Этот ID несовместим с маршрутом удаления RAG API.";
  }
  return null;
}
