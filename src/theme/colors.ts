export const C = {
  bg: "#0A0803",
  card: "#131319",
  card2: "#17171F",
  line: "rgba(255,255,255,.07)",

  kart: "rgba(255,255,255,.04)",
  kontrol: "rgba(255,255,255,.05)",
  kartUst: "rgba(255,255,255,.08)",
  gold: "#E8B341",
  gold2: "#F5CE6E",
  purple: "#8B5CF6",
  purple2: "#A78BFA",
  green: "#34D399",
  teal: "#5EEAD4",
  teal2: "#2DD4BF",
  red: "#F87171",
  text: "#F4F2EE",
  dim: "#8E8C99",
  dim2: "#5C5A66",
} as const;

export type ColorKey = keyof typeof C;
