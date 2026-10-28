import { getDocuments, resource } from "@/lib/backend";
import { PageHeading } from "@/components/page-heading";
import { UploadDialog } from "@/components/upload-dialog";
import { DocumentsTable } from "@/components/documents-table";
import { ErrorNotice } from "@/components/error-notice";
export const metadata = { title: "Документы" };
export default async function DocumentsPage() {
  const result = await resource(getDocuments);
  return (
    <>
      <PageHeading
        eyebrow="БАЗА ЗНАНИЙ"
        title="Документы"
        description="Все учебные материалы и их состояние в поисковом индексе."
        action={<UploadDialog />}
      />
      {result.error && <ErrorNotice message={result.error} />}
      <DocumentsTable
        documents={result.value || []}
        unavailable={Boolean(result.error)}
      />
    </>
  );
}
