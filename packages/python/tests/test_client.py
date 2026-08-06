import json, pathlib, sys, unittest, httpx
sys.path.insert(0, str(pathlib.Path(__file__).parents[1] / "src"))
from ai2human import AI2Human, AI2HumanError
FIXTURE=json.loads((pathlib.Path(__file__).parents[3]/"fixtures/create-task.request.json").read_text())
class ClientTests(unittest.TestCase):
    def test_create_uses_auth_and_idempotency(self):
        def handler(request):
            self.assertEqual(request.headers["x-agent-api-key"],"test"); self.assertEqual(request.headers["idempotency-key"],"fixture-001")
            return httpx.Response(201,json={"ok":True,"task_id":"task_fixture","status":"live","task_url":"http://mock/tasks/task_fixture","task":{"id":"task_fixture"}})
        client=AI2Human(api_key="test",base_url="http://mock",transport=httpx.MockTransport(handler))
        self.assertEqual(client.tasks.create(FIXTURE,idempotency_key="fixture-001")["task_id"],"task_fixture")
    def test_typed_error(self):
        client=AI2Human(api_key="test",base_url="http://mock",transport=httpx.MockTransport(lambda r:httpx.Response(400,json={"error":"bad","code":"INVALID_TASK"})))
        with self.assertRaises(AI2HumanError) as caught: client.tasks.create(FIXTURE)
        self.assertEqual(caught.exception.code,"INVALID_TASK")
if __name__=="__main__": unittest.main()
