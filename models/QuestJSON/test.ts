import { makeQuestGenerator } from "./model.ts";

import { load } from "https://deno.land/std@0.178.0/dotenv/mod.ts";

if (import.meta.main) {
  (async () => {
    const envVars = await load();

    const questGenerator = makeQuestGenerator();
    const quest = await questGenerator.generate(
      envVars["CHATGPT_TOKEN"] as string
    );

    console.log(quest);
  })();
}
