"use client";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty-panel">
      <AlertCircle size={32} />
      <h2>Не получилось открыть страницу</h2>
      <p>
        Попробуйте обновить данные. Если ошибка повторяется, проверьте настройки
        подключения.
      </p>
      <Button onClick={reset}>
        <RefreshCw size={16} />
        Повторить
      </Button>
    </div>
  );
}
