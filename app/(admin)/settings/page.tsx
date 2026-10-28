import { getConfig, resource } from "@/lib/backend";
import { PageHeading } from "@/components/page-heading";
import { SettingsForm } from "@/components/settings-form";
import { ErrorNotice } from "@/components/error-notice";
export const metadata = { title: "Настройки" };
export default async function SettingsPage() {
  const result = await resource(getConfig);
  return (
    <>
      <PageHeading
        eyebrow="ВАШ АССИСТЕНТ"
        title="Настройки"
        description="Выберите модель и настройте, как ассистент работает с материалами."
      />
      {result.error && <ErrorNotice message={result.error} />}{" "}
      {result.value && <SettingsForm initial={result.value} />}
    </>
  );
}
