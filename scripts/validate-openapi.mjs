import fs from "node:fs";

const text = fs.readFileSync(new URL("../openapi.yaml", import.meta.url), "utf8");
for (const required of [
  "openapi: 3.1.0",
  "/api/agent/tasks:",
  "/api/tasks/{taskId}:",
  "/api/tasks/{taskId}/proof:",
  "Idempotency-Key",
  "funding_mode"
]) {
  if (!text.includes(required)) throw new Error(`OpenAPI is missing ${required}`);
}
console.log("Validated OpenAPI contract surface.");
