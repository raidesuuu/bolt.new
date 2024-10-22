// app/routes/api/set-model.ts
import { json, type ActionFunction } from "@remix-run/cloudflare";
import { currentModel } from "~/lib/.server/llm/model";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const uid = formData.get("uid");

  if (typeof uid === "string") {
    return json({ model: currentModel[uid].model });

  }

  return json({ success: false, error: "Invalid model of uid" }, { status: 400 });
};
