"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  FileStack,
  LayoutGrid,
  LogOut,
  Menu,
  PanelLeftClose,
  Settings2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "Обзор", icon: LayoutGrid },
  { href: "/documents", label: "Документы", icon: FileStack },
  { href: "/settings", label: "Настройки", icon: Settings2 },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      <div className="sidebar-brand">
        <Link href="/" aria-label="Moodle Knowledge" onClick={onNavigate}>
          <Brand />
        </Link>
      </div>
      <div className="workspace-switch">
        <span className="workspace-icon">
          <Sparkles size={18} />
        </span>
        <div>
          <strong>База знаний</strong>
          <span>Рабочее пространство</span>
        </div>
        <ChevronDown size={14} className="ml-auto text-muted-foreground" />
      </div>
      <span className="nav-label">УПРАВЛЕНИЕ</span>
      <nav aria-label="Основная навигация">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "nav-link",
              pathname === item.href && "nav-link-active",
            )}
            aria-current={pathname === item.href ? "page" : undefined}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
            {pathname === item.href && <span className="nav-active-dot" />}
          </Link>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-tip">
          <div className="tip-icon">
            <ShieldCheck size={18} />
          </div>
          <strong>Ваше пространство знаний</strong>
          <p>Материалы и настройки ассистента в одном месте.</p>
          <Link href="/settings" onClick={onNavigate}>
            Настроить ассистента <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className="sidebar-footer">
          <span className="tiny-logo">
            <PanelLeftClose size={15} />
          </span>
          <span>Moodle Knowledge</span>
          <span className="version-badge">v1.0</span>
        </div>
      </div>
    </>
  );
}

export function AppShell({
  login,
  children,
}: {
  login: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const current = navigation.find((item) => item.href === pathname);
  return (
    <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
      <div className="app-shell">
        <aside className="sidebar hidden md:flex">
          <SidebarContent />
        </aside>
        <div className="main-shell">
          <header className="topbar">
            <div className="breadcrumbs">
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden max-md:inline-flex"
                  aria-label="Открыть меню"
                >
                  <Menu size={19} />
                </Button>
              </DialogTrigger>
              <span className="hidden sm:inline">Рабочее пространство</span>
              <ChevronRight size={13} className="hidden sm:block" />
              <span className="breadcrumb-current">
                {current?.label || "Управление"}
              </span>
            </div>
            <div className="topbar-right">
              <span className="environment-badge">
                <span />
                Локальное пространство
              </span>
              <span className="topbar-divider" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="account-button" aria-label="Меню аккаунта">
                    <span className="avatar">
                      {login.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="account-text">
                      <strong>{login}</strong>
                      <span>Администратор</span>
                    </span>
                    <ChevronDown size={13} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => void logoutAction()}>
                    <LogOut size={16} />
                    Выйти из аккаунта
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="page-content">{children}</main>
          <footer className="main-footer">
            <span>Moodle Knowledge</span>
            <span>Документы превращаются в ответы.</span>
          </footer>
        </div>
      </div>
      <DialogContent className="mobile-sidebar-dialog !inset-y-0 !left-0 !right-auto !h-dvh !w-[min(280px,88vw)] !max-w-none !translate-x-0 !translate-y-0 !gap-0 !rounded-none !border-y-0 !border-l-0 !p-5 !pt-7 !flex !flex-col overflow-y-auto">
        <DialogTitle className="sr-only">Навигация по пространству</DialogTitle>
        <DialogDescription className="sr-only">
          Выберите раздел панели управления.
        </DialogDescription>
        <SidebarContent onNavigate={() => setMenuOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
