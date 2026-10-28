import { AlertCircle } from "lucide-react";
export function ErrorNotice({ message }: { message: string }) {
  return (
    <div role="alert" className="error-notice">
      <AlertCircle size={18} className="shrink-0" />
      <div>
        <strong>Не удалось получить данные</strong>
        <p>{message}</p>
      </div>
    </div>
  );
}
