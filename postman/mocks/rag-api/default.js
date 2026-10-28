// Local-only stand-in derived from rag-service schemas/admin.py and routers/ingest.py.
// All documents and credentials here are synthetic QA fixtures.
const http = require("node:http");
const initialConfig = {
  LLM_PROVIDER: "openrouter", OLLAMA_BASE_URL: "http://127.0.0.1:11434", OLLAMA_MODEL: "",
  OLLAMA_TIMEOUT: 120, OPENROUTER_BASE_URL: "https://openrouter.ai/api/v1",
  OPENROUTER_MODEL: "", OPENROUTER_API_KEY_SET: false, TOP_K: 5, SEARCH_MODE: "hybrid",
  RERANKER_ENABLED: false, RERANKER_MODEL: "BAAI/bge-reranker-v2-m3", RERANKER_CANDIDATES: 20,
  PDF_PARSER: "pymupdf", CHUNK_STRATEGY: "semantic", CHUNK_SIZE: 800, CHUNK_OVERLAP: 100,
  CONTEXT_PER_CHUNK: 1200, FAITHFULNESS_CHECK_ENABLED: false,
  RAG_PROMPT: "Ответь по контексту: {context}\nВопрос: {query}",
};
const seedDocuments = Array.from({ length: 13 }, (_, index) => ({
  doc_id: `qa-seed-${index + 1}`, course_id: index < 3 ? "all" : "course-101",
  title: `QA · Учебный материал ${String(index + 1).padStart(2, "0")}`,
  filename: `qa-lecture-${index + 1}.pdf`, author: index < 3 ? "Анна Петрова" : "Иван Соколов",
  publish_date: "2026-10-28", keywords: ["лекция", "QA"], chunks: 8 + index,
  reindexable: index % 2 === 0,
}));
function send(res, status, value) { res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify(value)); }
http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const path = url.pathname;
  const method = req.method;
  let docs = await pm.state.get("rag.documents");
  let config = await pm.state.get("rag.config");
  if (!docs) { docs = structuredClone(seedDocuments); await pm.state.set("rag.documents", docs); }
  if (!config) { config = { ...initialConfig }; await pm.state.set("rag.config", config); }
  if (path === "/__qa/mode" && method === "POST") { await pm.state.set("rag.errorStatus", Number(req.body?.status || 0)); return send(res, 200, { ok: true }); }
  if (path === "/__qa/reset" && method === "POST") { await pm.state.set("rag.documents", structuredClone(seedDocuments)); await pm.state.set("rag.config", { ...initialConfig }); await pm.state.set("rag.errorStatus", 0); return send(res, 200, { ok: true }); }
  const failure = await pm.state.get("rag.errorStatus");
  if (failure) return send(res, failure, { detail: "Синтетическая ошибка для проверки интерфейса" });
  if (path === "/api/health" && method === "GET") return send(res, 200, { status: "ok", chroma: `ok (${docs.reduce((sum, d) => sum + d.chunks, 0)} chunks)` });
  const service = path.startsWith("/api/ingest");
  if ((service ? req.headers["x-service-token"] : req.headers["x-admin-token"]) !== (service ? "qa-service-token" : "qa-admin-token")) return send(res, 401, { detail: "Invalid service token" });
  if (path === "/api/documents" && method === "GET") return send(res, 200, docs);
  if (path === "/api/config" && method === "GET") return send(res, 200, { config });
  if (path === "/api/config" && method === "PATCH") {
    const patch = req.body || {};
    const effective = { ...config, ...patch };
    if (effective.LLM_PROVIDER === "openrouter" && !config.OPENROUTER_API_KEY_SET && !patch.OPENROUTER_API_KEY) return send(res, 422, { detail: "OPENROUTER_API_KEY is required when LLM_PROVIDER=openrouter" });
    if (effective.CHUNK_OVERLAP > effective.CHUNK_SIZE) return send(res, 422, { detail: "CHUNK_OVERLAP cannot be greater than CHUNK_SIZE" });
    const keys = Object.keys(patch);
    if (Object.hasOwn(patch, "OPENROUTER_API_KEY")) { config.OPENROUTER_API_KEY_SET = Boolean(patch.OPENROUTER_API_KEY); delete patch.OPENROUTER_API_KEY; }
    config = { ...config, ...patch }; await pm.state.set("rag.config", config);
    return send(res, 200, { config, updated_fields: keys, reindex_required: keys.some(key => ["PDF_PARSER", "CHUNK_STRATEGY", "CHUNK_SIZE", "CHUNK_OVERLAP"].includes(key)) });
  }
  if (path === "/api/ingest/file" && method === "POST") {
    if (!req.headers["content-type"]?.includes("multipart/form-data")) return send(res, 422, { detail: "file is required" });
    const docId = url.searchParams.get("doc_id"); const courseId = url.searchParams.get("course_id");
    if (!docId || !courseId) return send(res, 422, { detail: "doc_id and course_id are required" });
    docs = docs.filter(doc => doc.doc_id !== docId);
    docs.unshift({ doc_id: docId, course_id: courseId, title: url.searchParams.get("title") || docId,
      author: url.searchParams.get("author") || "", filename: "qa-upload.pdf",
      publish_date: url.searchParams.get("publish_date"), keywords: url.searchParams.getAll("keywords"), chunks: 4, reindexable: false });
    await pm.state.set("rag.documents", docs); return send(res, 200, { doc_id: docId, chunks: 4, detail: "indexed" });
  }
  if (path.startsWith("/api/ingest/") && method === "DELETE") {
    const id = decodeURIComponent(path.slice("/api/ingest/".length));
    await pm.state.set("rag.documents", docs.filter(doc => doc.doc_id !== id));
    return send(res, 200, { message: `${id} deleted` });
  }
  if (path === "/api/reindex" && method === "POST") {
    const ids = req.body?.doc_ids || docs.map(doc => doc.doc_id);
    return send(res, 200, { results: ids.map(id => {
      const doc = docs.find(item => item.doc_id === id);
      return { doc_id: id, status: !doc ? "not_found" : doc.reindexable ? "indexed" : "not_reindexable", chunks: doc?.reindexable ? doc.chunks : 0 };
    }) });
  }
  return send(res, 501, { detail: "This path is not modeled by the QA fixture" });
}).listen(process.env.PORT || 4901);
