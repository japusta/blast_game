import { SuperType } from "./TileModel";

export interface ClickResult {
  removed: { row: number; col: number }[];
  moved: { from: { r: number; c: number }; to: { r: number; c: number } }[];
  created: { row: number; col: number; color: number }[];
  super?: { row: number; col: number; type: SuperType } | null;
}