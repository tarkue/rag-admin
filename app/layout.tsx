import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Moodle Knowledge — управление знаниями",
    template: "%s · Moodle Knowledge",
  },
  description: "Рабочее пространство для документов и умного поиска Moodle.",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <TooltipProvider>
          {children}
          <Toaster
            theme="light"
            position="bottom-right"
            richColors
            closeButton
          />
        </TooltipProvider>
      </body>
    </html>
  );
}
