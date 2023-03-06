import { IChatGPTError, makeChatGPT } from "../../chat-pgt.ts";

interface IQuest {
  description: string;
  data: {
    enemies?: {
      name: string;
      amount: number;
    }[];
    targetItems?: {
      name: string;
      amount: number;
    }[];
    targetCharacters?: {
      name: string;
      amount: number;
    }[];
  };
}

interface IQuestGenerator {
  generate: (
    token: string,
    questDescription?: string
  ) => Promise<IQuest | IChatGPTError>;
}

export const makeQuestGenerator = (): IQuestGenerator => {
  const chatGPT = makeChatGPT();

  const jsonDirective = `Generate a JSON based on a text with the following fields:
  - description: The provided text without any change. (Required!)
  - data: An object (Required! Also, it should not be an empty object)
  - data.enemies: An array of objects, each object must have a name (type string) and a amount (type number) field, that describe the enemies present in the text. (Optional, only if enemies present in the text)
  - data.targetItems: An array of objects, each object must have a name (type string) and a amount (type number) field, that describe an item to be acquired, as described in the text. (Optional, only if an item is to be acquired)
  - data.targetCharacters: An array of objects, each object must have a name (type string) and a amount (type number) field, that describe a character to be found, as described in the text. (Optional, only if a character is to be found)

  Your response must only contain the json and nothing else.`;

  const generateQuestDirective = `Generate a quest using no more than 50 words, and must be written in as if directed to the character. This quest may contain a combination of the following elements (optional):
  - Enemies to be defeated
  - Items to be acquired
  - Characters to be found
  
  Use the generated quest as a base to generate the JSON.
  Only the JSON must be present in the response, and it must be formatted as markdown.`;

  const _createQuestDirective = (questDescription: string) =>
    `Generate the JSON based on the following quest description: ${questDescription}`;

  const generate = async (token: string, questDescription?: string) => {
    const questDirective = questDescription
      ? _createQuestDirective(questDescription)
      : generateQuestDirective;

    const result = await chatGPT.send(token, [
      { role: "system", content: jsonDirective + questDirective },
      { role: "user", content: "Generate." },
    ]);

    if ("error" in result) return result;

    // Regex by: ChatGPT :p
    const messageJSON =
      "content" in result
        ? result.content.match(/```(?:json)?\s*([\s\S]*?)\s*```/)?.[1]
        : undefined;

    if (!messageJSON)
      return {
        error: "Model Error: Could not parse JSON",
      };

    try {
      const quest = JSON.parse(messageJSON) as IQuest;
      // TODO: Should validate if quest is the expected type before returning
      return quest;
    } catch (err) {
      return {
        error: `Model Error (${err.name}): ${err.message}`,
      };
    }
  };

  return {
    generate,
  };
};
