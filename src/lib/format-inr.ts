// Format an INR amount into Indian short words (Crore / Lakh / Thousand).
// Examples: 500000000 -> "50 Crore", 5000000 -> "50 Lakh", 75000 -> "75 Thousand", 999 -> "999"
export function formatINRWords(value: number | string | null | undefined): string {
  const n = Number(value);
  if (!isFinite(n) || n === 0) return "0";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";

  const fmt = (v: number) => {
    const rounded = Math.round(v * 100) / 100;
    return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(2).replace(/\.?0+$/, "");
  };

  if (abs >= 1_00_00_000) return `${sign}${fmt(abs / 1_00_00_000)} Crore`;
  if (abs >= 1_00_000) return `${sign}${fmt(abs / 1_00_000)} Lakh`;
  if (abs >= 1_000) return `${sign}${fmt(abs / 1_000)} Thousand`;
  return `${sign}${abs.toLocaleString("en-IN")}`;
}

// Convenience: prefix with ₹
export const formatINRWordsRupee = (v: number | string | null | undefined) => `₹${formatINRWords(v)}`;
