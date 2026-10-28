export interface DocumentRecord {
  doc_id: string;
  course_id: string;
  title: string;
  filename: string | null;
  author: string;
  publish_date: string | null;
  keywords: string[];
  chunks: number;
  reindexable: boolean;
}
export interface RagConfig {
  LLM_PROVIDER: "openrouter" | "ollama";
  OLLAMA_BASE_URL: string;
  OLLAMA_MODEL: string;
  OLLAMA_TIMEOUT: number;
  OPENROUTER_BASE_URL: string;
  OPENROUTER_MODEL: string;
  OPENROUTER_API_KEY_SET: boolean;
  TOP_K: number;
  SEARCH_MODE: "dense" | "bm25" | "hybrid";
  RERANKER_ENABLED: boolean;
  RERANKER_MODEL: string;
  RERANKER_CANDIDATES: number;
  PDF_PARSER: "pymupdf" | "pix2text";
  CHUNK_STRATEGY: "semantic" | "recursive";
  CHUNK_SIZE: number;
  CHUNK_OVERLAP: number;
  CONTEXT_PER_CHUNK: number;
  FAITHFULNESS_CHECK_ENABLED: boolean;
  RAG_PROMPT: string;
}
export type ConfigPatch = Partial<Omit<RagConfig, "OPENROUTER_API_KEY_SET">> & {
  OPENROUTER_API_KEY?: string;
};
export interface Health {
  status: string;
  chroma: string;
}
export type ActionResult =
  | { ok: true; message: string; reindexRequired?: boolean }
  | { ok: false; message: string };
export interface Resource<T> {
  value: T | null;
  error: string | null;
}
