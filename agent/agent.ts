import { defineAgent } from "eve";
import { deepseek } from "@ai-sdk/deepseek";

export default defineAgent({
  model: deepseek("deepseek-chat"),
  modelContextWindowTokens: 64_000,
});
