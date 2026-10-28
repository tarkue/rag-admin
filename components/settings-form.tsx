"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  KeyRound,
  Layers3,
  Loader2,
  MessageSquareText,
  Save,
  ScanText,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { saveConfig } from "@/app/actions/rag";
import { validatePrompt } from "@/lib/validation";
import type { ConfigPatch, RagConfig } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SettingsForm({ initial }: { initial: RagConfig }) {
  const [config, setConfig] = useState(initial);
  const [baseline, setBaseline] = useState(initial);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [reindexRequired, setReindexRequired] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const changed =
    (Object.keys(config) as (keyof RagConfig)[]).some(
      (key) => config[key] !== baseline[key],
    ) || Boolean(apiKey);
  function update<K extends keyof RagConfig>(key: K, value: RagConfig[K]) {
    setConfig((current) => ({ ...current, [key]: value }));
  }
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (config.CHUNK_OVERLAP > config.CHUNK_SIZE) {
      toast.error("Перекрытие не может быть больше размера фрагмента.");
      return;
    }
    const promptError = validatePrompt(config.RAG_PROMPT);
    if (promptError) {
      toast.error(promptError);
      return;
    }
    if (
      config.LLM_PROVIDER === "openrouter" &&
      !config.OPENROUTER_MODEL.trim()
    ) {
      toast.error("Укажите ID модели OpenRouter.");
      return;
    }
    if (
      config.LLM_PROVIDER === "openrouter" &&
      !baseline.OPENROUTER_API_KEY_SET &&
      !apiKey.trim()
    ) {
      toast.error("Добавьте API-ключ OpenRouter.");
      return;
    }
    const patch: ConfigPatch = {};
    for (const key of Object.keys(config) as (keyof RagConfig)[]) {
      if (key !== "OPENROUTER_API_KEY_SET" && config[key] !== baseline[key])
        Object.assign(patch, { [key]: config[key] });
    }
    if (apiKey.trim()) patch.OPENROUTER_API_KEY = apiKey.trim();
    startTransition(async () => {
      try {
        const result = await saveConfig(patch);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        const saved = {
          ...config,
          OPENROUTER_API_KEY_SET:
            config.OPENROUTER_API_KEY_SET || Boolean(apiKey.trim()),
        };
        setBaseline(saved);
        setConfig(saved);
        setApiKey("");
        setReindexRequired(Boolean(result.reindexRequired));
        toast.success(result.message);
        router.refresh();
      } catch {
        toast.error(
          "Сохранение прервано. Обновите страницу и попробуйте ещё раз.",
        );
      }
    });
  }
  return (
    <form onSubmit={submit}>
      <Tabs defaultValue="model" className="settings-tabs min-w-0 max-w-full">
        <TabsList className="settings-tab-list !h-auto w-full max-w-full justify-start overflow-x-auto !rounded-none !bg-transparent !p-0">
          <TabsTrigger value="model">
            <Sparkles size={16} />
            Модель ответов
          </TabsTrigger>
          <TabsTrigger value="search">
            <Search size={16} />
            Поиск и контекст
          </TabsTrigger>
          <TabsTrigger value="documents">
            <Layers3 size={16} />
            Обработка документов
          </TabsTrigger>
          <TabsTrigger value="prompt">
            <MessageSquareText size={16} />
            Системный промпт
          </TabsTrigger>
        </TabsList>
        <fieldset disabled={pending} className="min-w-0 disabled:opacity-70">
          <TabsContent value="model">
            <div className="settings-layout">
              <section className="panel settings-panel">
                <SettingsHeading
                  icon={<Sparkles size={20} />}
                  title="Модель ответов"
                  description="Модель превращает найденный контекст в ответ с источниками."
                />
                <Field
                  label="Провайдер"
                  htmlFor="provider"
                  hint="OpenRouter — облачные модели, Ollama — локальные."
                >
                  <Select
                    value={config.LLM_PROVIDER}
                    onValueChange={(value) =>
                      update("LLM_PROVIDER", value as RagConfig["LLM_PROVIDER"])
                    }
                  >
                    <SelectTrigger id="provider" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openrouter">OpenRouter</SelectItem>
                      <SelectItem value="ollama">Ollama</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                {config.LLM_PROVIDER === "openrouter" ? (
                  <>
                    <Field
                      label="API-ключ"
                      htmlFor="api-key"
                      hint={
                        baseline.OPENROUTER_API_KEY_SET
                          ? "Ключ сохранён на сервере. Оставьте поле пустым, чтобы его не менять."
                          : "Ключ будет сохранён на сервере и не возвращается в браузер."
                      }
                      badge={
                        baseline.OPENROUTER_API_KEY_SET ? (
                          <Badge className="key-saved">
                            <Check size={12} />
                            Сохранён
                          </Badge>
                        ) : undefined
                      }
                    >
                      <div className="relative">
                        <KeyRound className="input-leading-icon" size={16} />
                        <Input
                          id="api-key"
                          type={showKey ? "text" : "password"}
                          value={apiKey}
                          onChange={(event) => setApiKey(event.target.value)}
                          placeholder={
                            baseline.OPENROUTER_API_KEY_SET
                              ? "••••••••••••••••••••••••"
                              : "sk-or-v1-…"
                          }
                          autoComplete="off"
                          className="h-11 pr-11 pl-10"
                        />
                        <button
                          type="button"
                          aria-label={showKey ? "Скрыть ключ" : "Показать ключ"}
                          className="password-toggle"
                          onClick={() => setShowKey(!showKey)}
                        >
                          {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </Field>
                    <Field
                      label="ID модели"
                      htmlFor="openrouter-model"
                      hint="Полный идентификатор из каталога OpenRouter, в формате provider/model."
                    >
                      <Input
                        id="openrouter-model"
                        value={config.OPENROUTER_MODEL}
                        onChange={(event) =>
                          update("OPENROUTER_MODEL", event.target.value)
                        }
                        placeholder="provider/model"
                        maxLength={200}
                        required
                        className="h-11 font-mono text-sm"
                      />
                    </Field>
                    <Field
                      label="Адрес API"
                      htmlFor="openrouter-url"
                      hint="Стандартный адрес OpenRouter; меняйте только при использовании прокси."
                    >
                      <Input
                        id="openrouter-url"
                        type="url"
                        value={config.OPENROUTER_BASE_URL}
                        onChange={(event) =>
                          update("OPENROUTER_BASE_URL", event.target.value)
                        }
                        required
                      />
                    </Field>
                  </>
                ) : (
                  <>
                    <Field label="Адрес Ollama" htmlFor="ollama-url">
                      <Input
                        id="ollama-url"
                        type="url"
                        value={config.OLLAMA_BASE_URL}
                        onChange={(event) =>
                          update("OLLAMA_BASE_URL", event.target.value)
                        }
                        required
                      />
                    </Field>
                    <Field
                      label="Локальная модель"
                      htmlFor="ollama-model"
                      hint="Имя модели, установленной в Ollama."
                    >
                      <Input
                        id="ollama-model"
                        value={config.OLLAMA_MODEL}
                        onChange={(event) =>
                          update("OLLAMA_MODEL", event.target.value)
                        }
                        placeholder="Имя установленной модели"
                        required
                        maxLength={200}
                      />
                    </Field>
                  </>
                )}
                <NumberField
                  label="Время ожидания ответа"
                  id="timeout"
                  value={config.OLLAMA_TIMEOUT}
                  onChange={(value) => update("OLLAMA_TIMEOUT", value)}
                  min={1}
                  max={900}
                  unit="секунд"
                  hint="Максимальное время одного обращения к модели."
                />
              </section>
              <aside className="settings-aside">
                <div className="settings-note-card">
                  <span className="settings-note-icon">
                    <ShieldCheck size={22} />
                  </span>
                  <h3>Ключи остаются у вас</h3>
                  <p>
                    Учётные данные хранятся на сервере. Браузер обращается к
                    защищённой панели, а не напрямую к API модели.
                  </p>
                </div>
                <div className="settings-help">
                  <h4>Как выбрать модель</h4>
                  <p>
                    Скопируйте ID нужной модели из каталога OpenRouter.
                    Убедитесь, что на аккаунте достаточно средств.
                  </p>
                  <a
                    href="https://openrouter.ai/models"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Каталог моделей
                    <ChevronRight size={14} />
                  </a>
                </div>
              </aside>
            </div>
          </TabsContent>
          <TabsContent value="search">
            <div className="settings-layout">
              <section className="panel settings-panel">
                <SettingsHeading
                  icon={<Search size={20} />}
                  title="Поиск и контекст"
                  description="Определите, какие фрагменты попадут в ответ ассистента."
                />
                <Field
                  label="Режим поиска"
                  htmlFor="search-mode"
                  hint="Гибридный режим объединяет поиск по смыслу и ключевым словам."
                >
                  <Select
                    value={config.SEARCH_MODE}
                    onValueChange={(value) =>
                      update("SEARCH_MODE", value as RagConfig["SEARCH_MODE"])
                    }
                  >
                    <SelectTrigger id="search-mode" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hybrid">
                        Гибридный · смысл + ключевые слова
                      </SelectItem>
                      <SelectItem value="dense">
                        Векторный · по смыслу
                      </SelectItem>
                      <SelectItem value="bm25">
                        BM25 · по ключевым словам
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <NumberField
                  label="Количество фрагментов"
                  id="top-k"
                  value={config.TOP_K}
                  onChange={(value) => update("TOP_K", value)}
                  min={1}
                  max={1000}
                  unit="фрагментов"
                  hint="Максимум фрагментов, которые модель использует для ответа."
                />
                <NumberField
                  label="Контекст из каждого фрагмента"
                  id="context"
                  value={config.CONTEXT_PER_CHUNK}
                  onChange={(value) => update("CONTEXT_PER_CHUNK", value)}
                  min={1}
                  max={100000}
                  unit="символов"
                />
                <div className="settings-divider" />
                <ToggleField
                  label="Переранжирование результатов"
                  description="Локальная модель дополнительно оценивает релевантность найденных фрагментов."
                  checked={config.RERANKER_ENABLED}
                  onChange={(value) => update("RERANKER_ENABLED", value)}
                />
                {config.RERANKER_ENABLED && (
                  <>
                    <Field label="Модель переранжирования" htmlFor="reranker">
                      <Input
                        id="reranker"
                        value={config.RERANKER_MODEL}
                        onChange={(event) =>
                          update("RERANKER_MODEL", event.target.value)
                        }
                        required
                        maxLength={200}
                      />
                    </Field>
                    <NumberField
                      label="Кандидаты для переранжирования"
                      id="candidates"
                      value={config.RERANKER_CANDIDATES}
                      onChange={(value) => update("RERANKER_CANDIDATES", value)}
                      min={1}
                      max={1000}
                      unit="фрагментов"
                    />
                  </>
                )}
                <div className="settings-divider" />
                <ToggleField
                  label="Проверка ответа по источникам"
                  description="Второй вызов модели проверяет черновик. Увеличивает время ответа и расход API."
                  checked={config.FAITHFULNESS_CHECK_ENABLED}
                  onChange={(value) =>
                    update("FAITHFULNESS_CHECK_ENABLED", value)
                  }
                />
              </section>
              <aside className="settings-aside">
                <div className="settings-note-card">
                  <span className="settings-note-icon">
                    <SlidersHorizontal size={22} />
                  </span>
                  <h3>Баланс точности и объёма</h3>
                  <p>
                    Больше контекста помогает в сложных вопросах, но увеличивает
                    расход токенов. Начните с 5 фрагментов и меняйте параметры
                    под свои материалы.
                  </p>
                </div>
              </aside>
            </div>
          </TabsContent>
          <TabsContent value="documents">
            <div className="settings-layout">
              <section className="panel settings-panel">
                <SettingsHeading
                  icon={<ScanText size={20} />}
                  title="Обработка документов"
                  description="Настройте извлечение текста и разбиение материалов на фрагменты."
                />
                <Field
                  label="Парсер PDF"
                  htmlFor="parser"
                  hint="PyMuPDF извлекает текст. Pix2Text распознаёт также формулы и таблицы, но работает медленнее."
                >
                  <Select
                    value={config.PDF_PARSER}
                    onValueChange={(value) =>
                      update("PDF_PARSER", value as RagConfig["PDF_PARSER"])
                    }
                  >
                    <SelectTrigger id="parser" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pymupdf">PyMuPDF · текст</SelectItem>
                      <SelectItem value="pix2text">
                        Pix2Text · текст и формулы
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Стратегия разбиения" htmlFor="strategy">
                  <Select
                    value={config.CHUNK_STRATEGY}
                    onValueChange={(value) =>
                      update(
                        "CHUNK_STRATEGY",
                        value as RagConfig["CHUNK_STRATEGY"],
                      )
                    }
                  >
                    <SelectTrigger id="strategy" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="semantic">
                        Семантическая · по логическим блокам
                      </SelectItem>
                      <SelectItem value="recursive">
                        Рекурсивная · по структуре текста
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <NumberField
                  label="Размер фрагмента"
                  id="chunk-size"
                  value={config.CHUNK_SIZE}
                  onChange={(value) => update("CHUNK_SIZE", value)}
                  min={1}
                  max={10000}
                  unit="токенов ≈"
                  hint="Размер оценивается приблизительно: около 4 символов на токен."
                />
                <NumberField
                  label="Перекрытие фрагментов"
                  id="overlap"
                  value={config.CHUNK_OVERLAP}
                  onChange={(value) => update("CHUNK_OVERLAP", value)}
                  min={0}
                  max={Math.min(5000, config.CHUNK_SIZE)}
                  unit="токенов ≈"
                  hint="Общая часть соседних фрагментов помогает сохранить контекст."
                />
              </section>
              <aside className="settings-aside">
                <div className="settings-note-card warning-note">
                  <span className="settings-note-icon">
                    <AlertCircle size={22} />
                  </span>
                  <h3>После изменений — новый индекс</h3>
                  <p>
                    Новые параметры применяются к следующим загрузкам. Уже
                    загруженные документы нужно переиндексировать или загрузить
                    повторно с прежним ID.
                  </p>
                </div>
              </aside>
            </div>
          </TabsContent>
          <TabsContent value="prompt">
            <section className="panel settings-panel prompt-panel">
              <SettingsHeading
                icon={<MessageSquareText size={20} />}
                title="Системный промпт"
                description="Задайте роль ассистента, стиль ответа и правила работы с контекстом."
              />
              <Field
                label="Инструкция для модели"
                htmlFor="prompt"
                hint="Обязательные переменные: {context} — найденные фрагменты, {query} — вопрос пользователя."
              >
                <Textarea
                  id="prompt"
                  value={config.RAG_PROMPT}
                  onChange={(event) => update("RAG_PROMPT", event.target.value)}
                  required
                  minLength={1}
                  maxLength={20000}
                  className="min-h-72 font-mono text-sm leading-7"
                />
              </Field>
              <div className="prompt-hint">
                <ShieldCheck size={17} />
                <p>
                  Сервис дополнительно передаёт правила работы с недоверенными
                  документами и требования к ссылкам на источники.
                </p>
              </div>
            </section>
          </TabsContent>
        </fieldset>
      </Tabs>
      {reindexRequired && (
        <div role="status" className="reindex-notice">
          <AlertCircle size={18} />
          <p>
            Параметры обработки изменены. Переиндексируйте существующие
            документы или загрузите их повторно с прежними ID.
          </p>
        </div>
      )}
      <div className="settings-save-bar">
        <span className={changed ? "unsaved-indicator" : "saved-indicator"}>
          {changed ? (
            <>
              <span />
              Есть несохранённые изменения
            </>
          ) : (
            <>
              <Check size={15} />
              Все изменения сохранены
            </>
          )}
        </span>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={!changed || pending}
            onClick={() => {
              setConfig(baseline);
              setApiKey("");
            }}
          >
            Отменить
          </Button>
          <Button type="submit" disabled={!changed || pending}>
            {pending ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Save size={16} />
            )}{" "}
            {pending ? "Сохраняем…" : "Сохранить изменения"}
          </Button>
        </div>
      </div>
    </form>
  );
}
function SettingsHeading({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="settings-panel-heading">
      <span>{icon}</span>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}
function Field({
  label,
  htmlFor,
  hint,
  badge,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="settings-field">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={htmlFor}>{label}</Label>
        {badge}
      </div>
      {children}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}
function NumberField({
  label,
  id,
  hint,
  value,
  onChange,
  min,
  max,
  unit,
}: {
  label: string;
  id: string;
  hint?: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  unit: string;
}) {
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <div className="number-input-row">
        <Input
          id={id}
          type="number"
          value={Number.isNaN(value) ? "" : value}
          min={min}
          max={max}
          step={1}
          required
          onChange={(event) => onChange(event.target.valueAsNumber)}
          className="w-36"
        />
        <span>{unit}</span>
      </div>
    </Field>
  );
}
function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="toggle-field">
      <div>
        <Label className="leading-6" htmlFor={label}>
          {label}
        </Label>
        <p>{description}</p>
      </div>
      <Switch id={label} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
