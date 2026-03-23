import z from "zod"

export const GroupFile = z
  .object({
    path: z.string(),
    additions: z.number(),
    deletions: z.number(),
  })
  .meta({ ref: "GroupFile" })

export const Group = z
  .object({
    title: z.string(),
    description: z.string(),
    files: z.array(GroupFile),
    order: z.number(),
  })
  .meta({ ref: "Group" })

export type Group = z.infer<typeof Group>
