import type { CSSProperties } from "react";

const base: CSSProperties = {
  fontFamily: '"Material Symbols Outlined", sans-serif',
  fontFeatureSettings: '"liga"',
  WebkitFontFeatureSettings: '"liga"',
  fontWeight: 400,
  fontStyle: "normal",
  lineHeight: 1,
  display: "inline-block",
  direction: "ltr",
  letterSpacing: "normal",
  textTransform: "none",
  whiteSpace: "nowrap",
  WebkitFontSmoothing: "antialiased",
};

export function materialSymbolIconStyle(filled: boolean): CSSProperties {
  return {
    ...base,
    fontVariationSettings: filled
      ? '"FILL" 1, "wght" 400, "GRAD" 0, "opsz" 24'
      : '"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24',
  };
}
