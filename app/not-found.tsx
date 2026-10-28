import Link from "next/link";
export default function NotFound() {
  return (
    <main className="empty-panel min-h-screen">
      <span className="eyebrow">404</span>
      <h1>Страница не найдена</h1>
      <Link href="/" className="text-primary">
        Вернуться в пространство →
      </Link>
    </main>
  );
}
