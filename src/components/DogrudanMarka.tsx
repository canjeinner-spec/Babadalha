import { StyleSheet, View } from "react-native";

import { Txt } from "@/components/Txt";
import { Icon } from "@/icons/Icon";
import { C } from "@/theme/colors";

const YOL_OYNAT = "M7 4l12 8-12 8V4z";

export function DogrudanMarka({ boyut = 30 }: { boyut?: number }) {
  return (
    <View style={styles.sar}>
      <Icon path={YOL_OYNAT} size={boyut * 0.72} color={C.teal2} fill={C.teal2} sw={0} />
      <Txt
        weight="displayBold"
        size={boyut}
        color={C.gold}
        style={[styles.yazi, { lineHeight: boyut * 1.04 }]}
      >
        LINK
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  sar: { flexDirection: "row", alignItems: "center", gap: 7 },
  yazi: { letterSpacing: 1.5 },
});
