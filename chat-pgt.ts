export type MessageRole = "user" | "system" | "assistant";

export interface IChatGPTMessage {
  role: MessageRole;
  content: string;
}

export interface IChatGPTError {
  error: string;
}

export interface IMessageMemory {
  getMessages: () => IChatGPTMessage[];
  registerMessage: (message: IChatGPTMessage) => IChatGPTMessage[];
}

export interface IChatGPT {
  send: (
    token: string,
    messages: IChatGPTMessage[]
  ) => Promise<IChatGPTMessage | IChatGPTError>;
}

const CHATGPT_ENDPOINT = "https://api.openai.com/v1/chat/completions";

export const makeMessageMemory = (): IMessageMemory => {
  let messages: IChatGPTMessage[] = [];

  const getMessages = () => messages;

  const registerMessage = (message: IChatGPTMessage) => {
    messages = [...messages, message];
    return messages;
  };

  return {
    getMessages,
    registerMessage,
  };
};

export const makeChatGPT = (): IChatGPT => {
  const _postToChatGPT = (token: string, messages: IChatGPTMessage[]) => {
    return fetch(CHATGPT_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages,
      }),
    });
  };

  const send = async (token: string, messages: IChatGPTMessage[]) => {
    try {
      const response = await _postToChatGPT(token, messages);
      const json = await response.json();

      if ("error" in json)
        return {
          error: json.error,
        };

      return json.choices[0].message as IChatGPTMessage;
    } catch (err) {
      return {
        error: `Runtime error (${err.name}): ${err.message}`,
      };
    }
  };

  return {
    send,
  };
};
