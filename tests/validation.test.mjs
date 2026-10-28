import test from "node:test";
import assert from "node:assert/strict";
import {
  validatePrompt,
  validateDocumentId,
  validateRemovalId,
  courseFilterValue,
  matchesCourse,
  formatPublicationDate,
} from "../lib/validation.ts";

test("prompt accepts the two placeholders and escaped literal braces", () => {
  assert.equal(
    validatePrompt(
      'Контекст: {context} Вопрос: {query} JSON: {{"answer": true}}',
    ),
    null,
  );
});
test("prompt rejects unknown fields, unbalanced braces and format specifications", () => {
  for (const prompt of [
    "{context} {query} {foo}",
    "{context} {query} {",
    "{context} {query} }",
    "{context!r} {query}",
    "{context:>20} {query}",
    "{{context}} {query}",
  ]) {
    assert.equal(typeof validatePrompt(prompt), "string", prompt);
  }
});
test("document IDs cannot become URL path segments", () => {
  for (const id of ["course/file", ".", "..", "course\\file", "bad\u0000id"])
    assert.equal(typeof validateDocumentId(id), "string");
  assert.equal(validateDocumentId("course-lecture_1"), null);
  assert.equal(validateDocumentId("лекция-1"), null);
});
test("course named all is distinct from the all-courses filter", () => {
  assert.equal(matchesCourse("all", "another"), true);
  assert.equal(matchesCourse(courseFilterValue("all"), "another"), false);
  assert.equal(matchesCourse(courseFilterValue("all"), "all"), true);
});
test("publication dates keep their calendar day in every timezone", () => {
  const previous = process.env.TZ;
  process.env.TZ = "America/Los_Angeles";
  assert.match(formatPublicationDate("2026-10-28"), /28/);
  process.env.TZ = previous;
  assert.equal(formatPublicationDate(null), "Не указана");
  assert.equal(formatPublicationDate("bad-date"), "Не указана");
});

test("existing backend IDs remain removable even when they exceed upload limits", () => {
  assert.equal(validateRemovalId("legacy\\document"), null);
  assert.equal(validateRemovalId("x".repeat(250)), null);
  assert.equal(typeof validateRemovalId("course/file"), "string");
});
