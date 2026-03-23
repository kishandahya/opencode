import z from "zod"

export const Config = z
  .object({
    provider: z.enum(["anthropic", "openai"]).default("anthropic"),
    model: z.string().optional(),
    key: z.string().optional(),
  })
  .meta({ ref: "ReviewConfig" })

export type Config = z.infer<typeof Config>
