import test from "node:test";
import assert from "node:assert/strict";
import {AI2Human, AI2HumanError} from "../dist/index.js";
const request = JSON.parse(await (await import("node:fs/promises")).readFile(new URL("../../../fixtures/create-task.request.json", import.meta.url), "utf8"));
test("creates a task with auth and idempotency", async()=>{
  let seen;
  const client=new AI2Human({apiKey:"test",baseUrl:"http://mock",fetch:async(url,init)=>{seen={url,init}; return new Response(JSON.stringify({ok:true,task_id:"task_fixture",status:"live",task_url:"http://mock/tasks/task_fixture",task:{id:"task_fixture"}}),{status:201,headers:{"content-type":"application/json"}})}});
  const result=await client.tasks.create(request,{idempotencyKey:"fixture-001"});
  assert.equal(result.task_id,"task_fixture");
  assert.equal(new Headers(seen.init.headers).get("x-agent-api-key"),"test");
  assert.equal(new Headers(seen.init.headers).get("Idempotency-Key"),"fixture-001");
});
test("returns typed errors", async()=>{
  const client=new AI2Human({apiKey:"test",baseUrl:"http://mock",fetch:async()=>new Response(JSON.stringify({error:"bad",code:"INVALID_TASK"}),{status:400,headers:{"content-type":"application/json"}})});
  await assert.rejects(()=>client.tasks.create(request), error=>error instanceof AI2HumanError && error.code==="INVALID_TASK");
});
