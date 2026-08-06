from __future__ import annotations
import os
from typing import Any
import httpx

class AI2HumanError(RuntimeError):
    def __init__(self, message: str, status: int, code: str, details: Any, request_id: str | None = None):
        super().__init__(message); self.status=status; self.code=code; self.details=details; self.request_id=request_id

def _read(response: httpx.Response) -> dict[str, Any]:
    try: payload=response.json()
    except ValueError: payload={"error":f"HTTP {response.status_code}"}
    if response.is_error: raise AI2HumanError(str(payload.get("error") or response.reason_phrase), response.status_code, str(payload.get("code") or "HTTP_ERROR"), payload.get("details", payload), response.headers.get("x-request-id"))
    return payload

class Tasks:
    def __init__(self, client: "AI2Human"): self.client=client
    def create(self, payload: dict[str, Any], *, idempotency_key: str | None=None): return self.client._request("POST","/api/agent/tasks",json=payload,headers={"Idempotency-Key":idempotency_key} if idempotency_key else None)
    def get(self, task_id: str): return self.client._request("GET",f"/api/tasks/{task_id}",auth="none")
    def categories(self): return self.client._request("GET","/api/agent/tasks/categories")
    def proof(self, task_id: str): return self.client._request("GET",f"/api/tasks/{task_id}/proof",auth="bearer")

class AI2Human:
    def __init__(self, *, api_key: str|None=None, access_token: str|None=None, base_url: str|None=None, transport: httpx.BaseTransport|None=None):
        self.api_key=api_key or os.getenv("AI2HUMAN_API_KEY") or os.getenv("AI2HUMAN_AGENT_KEY"); self.access_token=access_token; self.base_url=(base_url or os.getenv("AI2HUMAN_BASE_URL") or "https://ai2human.io").rstrip("/"); self.transport=transport; self.tasks=Tasks(self)
    def _request(self, method: str, path: str, *, auth: str="apiKey", **kwargs: Any):
        headers=dict(kwargs.pop("headers",None) or {}); headers["Accept"]="application/json"
        if auth=="apiKey":
            if not self.api_key: raise AI2HumanError("AI2Human API key is required.",401,"API_KEY_REQUIRED",None)
            headers["x-agent-api-key"]=self.api_key
        if auth=="bearer":
            if not self.access_token: raise AI2HumanError("AI2Human access token is required.",401,"ACCESS_TOKEN_REQUIRED",None)
            headers["Authorization"]=f"Bearer {self.access_token}"
        with httpx.Client(base_url=self.base_url,headers=headers,transport=self.transport,timeout=30) as client: return _read(client.request(method,path,**kwargs))

class AsyncTasks:
    def __init__(self, client: "AsyncAI2Human"): self.client=client
    async def create(self,payload:dict[str,Any],*,idempotency_key:str|None=None): return await self.client._request("POST","/api/agent/tasks",json=payload,headers={"Idempotency-Key":idempotency_key} if idempotency_key else None)
    async def get(self,task_id:str): return await self.client._request("GET",f"/api/tasks/{task_id}",auth="none")
    async def categories(self): return await self.client._request("GET","/api/agent/tasks/categories")
    async def proof(self,task_id:str): return await self.client._request("GET",f"/api/tasks/{task_id}/proof",auth="bearer")

class AsyncAI2Human:
    def __init__(self, *, api_key:str|None=None, access_token:str|None=None, base_url:str|None=None, transport:httpx.AsyncBaseTransport|None=None): self.api_key=api_key or os.getenv("AI2HUMAN_API_KEY") or os.getenv("AI2HUMAN_AGENT_KEY"); self.access_token=access_token; self.base_url=(base_url or os.getenv("AI2HUMAN_BASE_URL") or "https://ai2human.io").rstrip("/"); self.transport=transport; self.tasks=AsyncTasks(self)
    async def _request(self,method:str,path:str,*,auth:str="apiKey",**kwargs:Any):
        headers=dict(kwargs.pop("headers",None) or {}); headers["Accept"]="application/json"
        if auth=="apiKey":
            if not self.api_key: raise AI2HumanError("AI2Human API key is required.",401,"API_KEY_REQUIRED",None)
            headers["x-agent-api-key"]=self.api_key
        if auth=="bearer":
            if not self.access_token: raise AI2HumanError("AI2Human access token is required.",401,"ACCESS_TOKEN_REQUIRED",None)
            headers["Authorization"]=f"Bearer {self.access_token}"
        async with httpx.AsyncClient(base_url=self.base_url,headers=headers,transport=self.transport,timeout=30) as client: return _read(await client.request(method,path,**kwargs))
