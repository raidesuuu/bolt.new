// app/routes/api/set-model.ts
import { json, type ActionFunction } from "@remix-run/cloudflare";
import { setModel, type ModelType } from "~/lib/.server/llm/model";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const uid = formData.get("uid");
  const model = formData.get("model");

  if (typeof uid === "string" && typeof model === "string") {
    setModel(model as ModelType, uid); // サーバー側のモデルを更新
    console.log("Model changing detected: changed to: ", model)
    return json({ success: true });
  }

  return json({ success: false, error: "Invalid model of uid" }, { status: 400 });
};
