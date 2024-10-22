import { createOpenAI } from '@ai-sdk/openai';

export type ModelType = "claude-3-5-sonnet-20240620" | "claude-3-opus-20240229" | "gpt-4o" | "o1-preview" | "gemini-1.5-flash-exp-0827" | "gemini-1.5-pro-exp-0827" | "grok-2" | "grok-2-mini"
export type UserModelType = {"uid": string, "model": ModelType}

export let currentModel: Record<string, UserModelType> = {}
// export let currentModel: ModelType | undefined = "claude-3-5-sonnet-20240620"

export function getModel(model: ModelType) {
  const _model = createOpenAI({
    baseURL: "https://api.voids.top/v1/",
    apiKey: "emptyok"
  });

  return _model(model);
}

export function setModel(model: ModelType, uid: string) {
  currentModel[uid] = {uid, model}
}