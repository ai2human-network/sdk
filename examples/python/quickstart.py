import os
from ai2human import AI2Human
client=AI2Human(api_key=os.environ["AI2HUMAN_API_KEY"],base_url=os.getenv("AI2HUMAN_BASE_URL"))
print(client.tasks.categories())
