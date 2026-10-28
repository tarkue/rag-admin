import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { Brand } from "@/components/brand";
import {
  ArrowUpRight,
  FileText,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
export const metadata = { title: "Вход" };
export default async function LoginPage() {
  if (await getSession()) redirect("/");
  return (
    <main className="login-shell">
      <section className="login-story">
        <Brand light />
        <div className="login-story-content">
          <span className="eyebrow text-white/55">MOODLE KNOWLEDGE</span>
          <h1>
            Знания ближе.
            <br />
            <span>Ответы точнее.</span>
          </h1>
          <p>
            Одно пространство для учебных материалов,
            <br className="hidden lg:block" /> умного поиска и настройки вашего
            ассистента.
          </p>
          <div className="knowledge-visual" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="floating-icon float-document">
              <FileText size={27} />
            </div>
            <div className="floating-icon float-search">
              <Search size={24} />
            </div>
            <div className="knowledge-center">
              <Network size={49} strokeWidth={1.35} />
            </div>
            <div className="floating-icon float-spark">
              <Sparkles size={25} />
            </div>
            <span className="visual-label">Каждый документ — часть целого</span>
          </div>
        </div>
        <div className="login-story-footer">
          <span>Создано для осмысленного обучения</span>
          <ArrowUpRight size={17} />
        </div>
      </section>
      <section className="login-panel">
        <div className="login-mobile-brand">
          <Brand />
        </div>
        <div className="login-form-wrap">
          <div className="welcome-icon">
            <ShieldCheck size={23} />
          </div>
          <span className="eyebrow">РАБОЧЕЕ ПРОСТРАНСТВО</span>
          <h2>С возвращением</h2>
          <p className="text-muted-foreground mb-8">
            Войдите, чтобы управлять базой знаний.
          </p>
          <LoginForm />
          <div className="login-note">
            <ShieldCheck size={15} />
            <span>Доступ только для администратора</span>
          </div>
        </div>
        <p className="login-bottom">
          Moodle Knowledge <span>·</span> Панель управления
        </p>
      </section>
    </main>
  );
}
