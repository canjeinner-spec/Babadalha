import LottieView from "lottie-react-native";
import { memo, useEffect, useRef, type ComponentProps } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { useCanli } from "@/lib/canli";

type LottieKaynak = ComponentProps<typeof LottieView>["source"];

type Props = {
  kaynak: LottieKaynak;
  boyut?: number;
  dongu?: boolean;
  hiz?: number;
  ilerleme?: number;
  kapla?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const Anim = memo(function Anim({ kaynak, boyut = 140, dongu = true, hiz = 1, ilerleme, kapla = false, style }: Props) {
  const durukKare = ilerleme !== undefined;
  const canli = useCanli();
  const ref = useRef<LottieView>(null);
  useEffect(() => {
    if (durukKare) return;
    if (canli) ref.current?.play();
    else ref.current?.pause();
  }, [canli, durukKare]);
  return (
    <View style={[kapla ? { flex: 1 } : { width: boyut, height: boyut }, style]} pointerEvents="none">
      <LottieView
        ref={ref}
        source={kaynak}
        autoPlay={!durukKare}
        loop={durukKare ? false : dongu}
        speed={hiz}
        progress={durukKare ? ilerleme : undefined}
        enableMergePathsAndroidForKitKatAndAbove
        resizeMode={kapla ? "cover" : "contain"}
        style={{ width: "100%", height: "100%" }}
      />
    </View>
  );
});
