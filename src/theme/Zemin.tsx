import { StyleSheet } from "react-native";

import { C } from "./colors";
import { Gradient } from "./Gradient";
import { karart, saydam } from "./renk";
import { useTema } from "./tema";

const VARSAYILAN_TABAN = "#191307";

export function Zemin({ hale = true }: { hale?: boolean }) {
  const { ic } = useTema();
  const taban = ic?.zemin ?? VARSAYILAN_TABAN;
  const vurgu = ic?.vurgu ?? C.gold;

  return (
    <>
      <Gradient
        colors={[taban, karart(taban, 0.5), karart(taban, 0.86)]}
        deg={175}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {hale && (
        <Gradient
          colors={[saydam(vurgu, 0.1), "transparent"]}
          deg={180}
          style={styles.hale}
          pointerEvents="none"
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  hale: { position: "absolute", top: 0, left: 0, right: 0, height: 220 },
});
