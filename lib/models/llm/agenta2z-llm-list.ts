import { LLM } from "@/types"

const ANTHROPIC_PLATFORM_LINK =
  "https://docs.anthropic.com/claude/reference/getting-started-with-the-api"

// Claude 3.5 Sonnet (UPDATED 06/20/24)
const AGENTA2Z: LLM = {
  modelId: "agenta2z-1.0",
  modelName: "AgentA2Z 1.0",
  provider: "agenta2z",
  hostedId: "agenta2z-1-0",
  platformLink: ANTHROPIC_PLATFORM_LINK,
  imageInput: true,
  pricing: {
    currency: "USD",
    unit: "1M tokens",
    inputCost: 3,
    outputCost: 15
  }
}

export const AGENTA2Z_LLM_LIST: LLM[] = [AGENTA2Z]
