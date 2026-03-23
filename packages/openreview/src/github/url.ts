export function parse(input: string): { owner: string; repo: string; number: number } {
  const full = input.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/)
  if (full) return { owner: full[1], repo: full[2], number: parseInt(full[3], 10) }

  const short = input.match(/^([^/]+)\/([^#]+)#(\d+)$/)
  if (short) return { owner: short[1], repo: short[2], number: parseInt(short[3], 10) }

  throw new Error(`Invalid PR URL: ${input}`)
}
