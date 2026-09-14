import { Text, type TextProps, type TextStyle } from "react-native";

import { C } from "@/theme/colors";
import { Font } from "@/theme/fonts";
import { renderSay } from "@/lib/takilma/sayac";

type Weight = keyof typeof Font;

type TxtProps = TextProps & {
  weight?: Weight;
  size?: number;
  color?: string;
  lh?: number;
  align?: TextStyle["textAlign"];
};

const EN_COK_BUYUTME = 1.25;

export function Txt({
  weight = "medium", size = 14, color = C.text, lh, align, style,
  maxFontSizeMultiplier = EN_COK_BUYUTME, ...rest
}: TxtProps) {
  renderSay("Txt");
  return (
    <Text
      {...rest}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[
        {
          fontFamily: Font[weight],
          fontSize: size,
          color,
          includeFontPadding: false,
          ...(lh ? { lineHeight: size * lh } : null),
          ...(align ? { textAlign: align } : null),
        },
        style,
      ]}
    />
  );
}
