import {createServer} from "node:http";
import {randomUUID} from "node:crypto";
const tasks=new Map<string,any>(); const idempotency=new Map<string,string>();
export function createMockServer(){return createServer(async(req,res)=>{
  res.setHeader("content-type","application/json"); res.setHeader("x-request-id",randomUUID());
  const url=new URL(req.url||"/","http://mock"); const send=(status:number,body:any)=>{res.statusCode=status;res.end(JSON.stringify(body));};
  if(url.pathname==="/health") return send(200,{ok:true,service:"ai2human-mock"});
  if(url.pathname==="/api/agent/tasks/categories"&&req.method==="GET"){
    if(!req.headers["x-agent-api-key"]) return send(401,{error:"API key required",code:"API_KEY_REQUIRED"});
    return send(200,{categories:["local_verification","identity_action","physical_task","digital_task","compliance_check","errand"],proof_types:["screenshot","photo","url","timestamp","receipt","signature","notes"],settlement:"Mock server never sends payments.",coverage:"Deterministic local testing only."});
  }
  if(url.pathname==="/api/agent/tasks"&&req.method==="POST"){
    if(!req.headers["x-agent-api-key"]) return send(401,{error:"API key required",code:"API_KEY_REQUIRED"});
    let raw=""; for await(const chunk of req) raw+=chunk; let input:any; try{input=JSON.parse(raw)}catch{return send(400,{error:"Invalid JSON",code:"INVALID_JSON"})}
    for(const field of ["title","description","category","funding_mode","reward_usdc","deadline_hours","proof_requirements"]) if(input[field]===undefined) return send(400,{error:`${field} is required`,code:"INVALID_TASK",details:{field}});
    const key=String(req.headers["idempotency-key"]||""); if(key&&idempotency.has(key)){const id=idempotency.get(key)!; const task=tasks.get(id); return send(201,{ok:true,task_id:id,status:task.campaign.agentLifecycle.workflowState,task_url:`http://127.0.0.1:8787/tasks/${id}`,task});}
    const id=`mock_${randomUUID()}`; const noPayout=input.funding_mode==="test_no_payout"; const now=new Date(); const task={id,title:input.title,budget:noPayout?"No payout · test":`${input.reward_usdc} USDC`,deadline:new Date(now.getTime()+input.deadline_hours*3600000).toISOString(),status:"created",taskState:noPayout?"open":"closed",updatedAt:now.toISOString(),evidence:[],campaign:{platform:"real_world",action:input.category,fundingMode:input.funding_mode,proofRequirements:input.proof_requirements,agentLifecycle:{workflowState:noPayout?"live":"awaiting_funding",fundingState:noPayout?"not_required":"funding_pending",settlementState:"not_ready"}}}; tasks.set(id,task); if(key)idempotency.set(key,id); return send(201,{ok:true,task_id:id,status:task.campaign.agentLifecycle.workflowState,task_url:`http://127.0.0.1:8787/tasks/${id}`,task});
  }
  const match=url.pathname.match(/^\/api\/tasks\/([^/]+)$/); if(match&&req.method==="GET"){const task=tasks.get(decodeURIComponent(match[1])); return task?send(200,{task,payment:null,poolStatus:null,alternateClaimTask:null}):send(404,{error:"Task not found",code:"NOT_FOUND"});}
  const proof=url.pathname.match(/^\/api\/tasks\/([^/]+)\/proof$/); if(proof&&req.method==="GET"){if(!String(req.headers.authorization||"").startsWith("Bearer "))return send(401,{error:"Bearer token required",code:"ACCESS_TOKEN_REQUIRED"}); if(!tasks.has(decodeURIComponent(proof[1])))return send(404,{error:"Task not found",code:"NOT_FOUND"}); return send(200,{proofBundle:null,verification:null});}
  return send(404,{error:"Route not found",code:"NOT_FOUND"});
});}
if(import.meta.url===`file://${process.argv[1]}`){const port=Number(process.env.PORT||8787); createMockServer().listen(port,"127.0.0.1",()=>console.log(`AI2Human Mock Server listening on http://127.0.0.1:${port}`));}
