export interface IClickProcessor {
  process(
    row: number,
    col: number,
    useBooster?: string | null,
    r2?: number,
    c2?: number
  ): import('./ClickProcessor').ClickOutcome;
}
