export interface ClickOutcome {
  result: import("./ClickResult").ClickResult;
  scoreDelta: number;
  consumeMove: boolean;
}