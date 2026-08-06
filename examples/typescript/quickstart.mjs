import {AI2Human} from "@ai2human/sdk";
const client=new AI2Human({apiKey:process.env.AI2HUMAN_API_KEY,baseUrl:process.env.AI2HUMAN_BASE_URL});
console.log(await client.tasks.categories());
