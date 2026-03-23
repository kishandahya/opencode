import z from "zod"

export const Finding = z
  .object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    file: z.string(),
    start: z.number(),
    end: z.number(),
    category: z.enum(["bug", "flag"]),
    confidence: z.number().min(0).max(1),
    severity: z.enum(["severe", "non-severe", "investigate", "informational"]),
    fix: z
      .object({
        code: z.string(),
        explanation: z.string(),
      })
      .optional(),
    resolved: z.boolean().default(false),
  })
  .meta({ ref: "Finding" })

export type Finding = z.infer<typeof Finding>
