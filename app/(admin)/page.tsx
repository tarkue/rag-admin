import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CircleCheck,
  CircleHelp,
  FileStack,
  FileText,
  FolderOpen,
  Layers3,
  Network,
  Settings2,
  Sparkles,
  Workflow,
} from "lucide-react";
import { getConfig, getDocuments, getHealth, resource } from "@/lib/backend";
import { PageHeading } from "@/components/page-heading";
import { UploadDialog } from "@/components/upload-dialog";
import { ErrorNotice } from "@/components/error-notice";
import { RefreshButton } from "@/components/refresh-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
export default async function OverviewPage() {
  const [documents, health, config] = await Promise.all([
    resource(getDocuments),
    resource(getHealth),
    resource(getConfig),
  ]);
  const docs = documents.value;
  const apiOk = health.value?.status === "ok";
  const dbOk = health.value?.chroma.startsWith("ok");
  const llmReady =
    config.value?.LLM_PROVIDER === "openrouter"
      ? config.value.OPENROUTER_API_KEY_SET &&
        Boolean(config.value.OPENROUTER_MODEL)
      : Boolean(config.value?.OLLAMA_MODEL);
  const model =
    config.value?.LLM_PROVIDER === "openrouter"
      ? config.value.OPENROUTER_MODEL
      : config.value?.OLLAMA_MODEL;
  const stats = [
    {
      label: "Документы",
      value: docs ? docs.length.toLocaleString("ru") : "—",
      hint: "В вашей базе знаний",
      icon: FileStack,
      className: "peach",
    },
    {
      label: "Фрагменты",
      value: docs
        ? docs.reduce((sum, doc) => sum + doc.chunks, 0).toLocaleString("ru")
        : "—",
      hint: "Доступны для поиска",
      icon: Layers3,
      className: "violet",
    },
    {
      label: "Учебные курсы",
      value: docs
        ? new Set(docs.map((doc) => doc.course_id)).size.toLocaleString("ru")
        : "—",
      hint: "С загруженными материалами",
      icon: FolderOpen,
      className: "blue",
    },
    {
      label: "Поиск",
      value: config.value
        ? { hybrid: "Гибридный", dense: "Векторный", bm25: "По словам" }[
            config.value.SEARCH_MODE
          ]
        : "—",
      hint: config.value
        ? `До ${config.value.TOP_K} фрагментов в ответе`
        : "Настройки недоступны",
      icon: Workflow,
      className: "green",
    },
  ];
  return (
    <>
      <PageHeading
        eyebrow="ВАШЕ РАБОЧЕЕ ПРОСТРАНСТВО"
        title="Обзор базы знаний"
        description="Всё, что нужно для точных и полезных ответов."
        action={<UploadDialog />}
      />
      {(documents.error || config.error) && (
        <ErrorNotice message={documents.error || config.error || ""} />
      )}
      <section className="stats-grid" aria-label="Статистика базы знаний">
        {stats.map((item) => (
          <div className="stat-card" key={item.label}>
            <div className="stat-card-top">
              <span>{item.label}</span>
              <span className={cn("stat-icon", item.className)}>
                <item.icon size={18} />
              </span>
            </div>
            <strong className="stat-value">{item.value}</strong>
            <p>{item.hint}</p>
          </div>
        ))}
      </section>
      <div className="overview-grid">
        <section className="panel documents-overview">
          <div className="panel-heading">
            <div>
              <h2>Ваши документы</h2>
              <p>Материалы, на которые опирается ассистент</p>
            </div>
            <Link href="/documents" className="text-link">
              Все документы <ArrowUpRight size={15} />
            </Link>
          </div>
          {docs?.length ? (
            <div className="recent-documents">
              {docs.slice(0, 5).map((doc) => (
                <Link
                  href="/documents"
                  key={doc.doc_id}
                  className="recent-document"
                >
                  <span className="document-type-icon">
                    <FileText size={20} />
                  </span>
                  <div>
                    <strong>{doc.title || doc.filename || doc.doc_id}</strong>
                    <span>
                      {doc.course_id} · {doc.author || "Автор не указан"}
                    </span>
                  </div>
                  <Badge variant="secondary">{doc.chunks} фрагм.</Badge>
                  <ArrowUpRight size={15} className="text-muted-foreground" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="onboarding-empty">
              <div className="document-art" aria-hidden="true">
                <div className="paper paper-back" />
                <div className="paper paper-front">
                  <span className="paper-orange" />
                  <span />
                  <span />
                  <span className="short" />
                  <div className="paper-spark">
                    <Sparkles size={19} />
                  </div>
                </div>
                <span className="art-dot dot-one" />
                <span className="art-dot dot-two" />
              </div>
              <h3>
                {documents.error
                  ? "Документы пока недоступны"
                  : "Большие знания начинаются с файла"}
              </h3>
              <p>
                {documents.error
                  ? "Проверьте соединение с сервисом и обновите страницу."
                  : "Добавьте первые материалы курса — и ассистент сможет находить ответы в ваших документах."}
              </p>
              {!documents.error && (
                <UploadDialog label="Добавить первый документ" />
              )}
              <span className="empty-formats">
                PDF <span>·</span> DOCX <span>·</span> PPTX
              </span>
            </div>
          )}
          <div className="panel-bottom-note">
            <ShieldNote />
            Поиск учитывает курс и возвращает ссылки на источники.
          </div>
        </section>
        <div className="overview-aside">
          <section className="panel service-panel">
            <div className="panel-heading">
              <h2>Состояние системы</h2>
              <span
                className={cn(
                  "live-dot",
                  apiOk && dbOk ? "live-dot-green" : "live-dot-muted",
                )}
              />
            </div>
            <div className="service-list">
              <ServiceRow
                label="RAG API"
                description="Обработка документов и запросов"
                ok={apiOk}
              />
              <ServiceRow
                label="Chroma"
                description="Векторная база знаний"
                ok={Boolean(dbOk)}
              />
              <ServiceRow
                label="Модель ответов"
                description={
                  llmReady
                    ? "Настроена · вызов не проверен"
                    : "Требуется настройка"
                }
                ok={Boolean(llmReady)}
                configured
              />
            </div>
            {health.error && <p className="service-error">{health.error}</p>}
            <div className="service-panel-footer">
              <span>Текущее состояние</span>
              <RefreshButton />
            </div>
          </section>
          <section className="model-card">
            <div className="model-card-icon">
              <Sparkles size={21} />
              <Badge variant="outline">
                {config.value?.LLM_PROVIDER === "ollama"
                  ? "Ollama"
                  : "OpenRouter"}
              </Badge>
            </div>
            <span className="eyebrow">ВАШ АССИСТЕНТ</span>
            <h3>{model || "Выберите модель"}</h3>
            <p>
              {model
                ? "Управляйте моделью и параметрами генерации ответов."
                : "Подключите модель, чтобы превратить найденные материалы в понятные ответы."}
            </p>
            <Link href="/settings">
              {model ? "Настройки модели" : "Подключить модель"}
              <ArrowRight size={16} />
            </Link>
          </section>
        </div>
      </div>
      <section className="pipeline-section">
        <div>
          <span className="eyebrow">КАК ЭТО РАБОТАЕТ</span>
          <h2>Путь от документа к ответу</h2>
        </div>
        <div className="pipeline">
          <PipelineStep
            icon={<FileText size={19} />}
            number="01"
            title="Материалы"
            description="Загружаете документы курса"
          />
          <ArrowRight className="pipeline-arrow" size={18} />
          <PipelineStep
            icon={<Boxes size={19} />}
            number="02"
            title="Индексация"
            description="Сервис выделяет фрагменты"
          />
          <ArrowRight className="pipeline-arrow" size={18} />
          <PipelineStep
            icon={<Network size={19} />}
            number="03"
            title="Умный поиск"
            description="Находит подходящий контекст"
          />
          <ArrowRight className="pipeline-arrow" size={18} />
          <PipelineStep
            icon={<Sparkles size={19} />}
            number="04"
            title="Точный ответ"
            description="Модель отвечает с источниками"
          />
        </div>
      </section>
    </>
  );
}
function ShieldNote() {
  return <CircleCheck size={15} />;
}
function ServiceRow({
  label,
  description,
  ok,
  configured,
}: {
  label: string;
  description: string;
  ok: boolean;
  configured?: boolean;
}) {
  return (
    <div className="service-row">
      <span className={cn("service-row-icon", ok && "service-row-ok")}>
        {ok ? <CircleCheck size={17} /> : <CircleHelp size={17} />}
      </span>
      <div>
        <strong>{label}</strong>
        <span>{description}</span>
      </div>
      <span
        className={cn("service-status", ok ? "status-green" : "status-amber")}
      >
        {ok ? (configured ? "Готово" : "Онлайн") : "Не готов"}
      </span>
    </div>
  );
}
function PipelineStep({
  icon,
  number,
  title,
  description,
}: {
  icon: React.ReactNode;
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="pipeline-step">
      <span className="pipeline-icon">{icon}</span>
      <div>
        <span className="pipeline-number">{number}</span>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}
