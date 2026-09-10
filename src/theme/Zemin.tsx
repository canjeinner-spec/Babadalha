import { StyleSheet } from "react-native";

import { C } from "./colors";
import { Gradient } from "./Gradient";

export function Zemin({ hale = true }: { hale?: boolean }) {
  return (
    <>
      <Gradient
        colors={["#16121F", "#0B0A11", "#08080C"]}
        deg={175}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {hale && (
        <Gradient
          colors={[C.gold + "1A", "transparent"]}
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
