import z from "zod"

export const PR = z
  .object({
    owner: z.string(),
    repo: z.string(),
    number: z.number(),
    title: z.string(),
    body: z.string(),
    status: z.enum(["open", "closed", "merged"]),
    head: z.string(),
    base: z.string(),
    author: z.string(),
    labels: z.array(z.string()),
    checks: z
      .object({
        passed: z.number(),
        total: z.number(),
      })
      .optional(),
    reviewers: z.array(z.string()),
  })
  .meta({ ref: "PR" })

export type PR = z.infer<typeof PR>
