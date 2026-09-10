import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";

export type YazilanBlok = { anahtar: string; metin: string };

type Props = {
  bloklar: YazilanBlok[];
  etkin: boolean;
  atla?: boolean;
  adim?: number;
  araAdim?: number;
  onBitti?: () => void;
  onIlerleme?: () => void;
  ciz: (blok: YazilanBlok, gorunenMetin: string, sira: number) => React.ReactNode;
};

export function YazilanMetin({
  bloklar,
  etkin,
  atla = false,
  adim = 2,
  araAdim = 16,
  onBitti,
  onIlerleme,
  ciz,
}: Props) {
  const toplam = bloklar.reduce((t, b) => t + b.metin.length, 0);
  const [yazilan, setYazilan] = useState(0);
  const titre = useSharedValue(0);
  const bittiRef = useRef(false);
  const sayacRef = useRef(0);

  useEffect(() => {
    if (!etkin || toplam === 0) return;
    let n = 0;
    const saat = setInterval(() => {
      n = Math.min(toplam, n + adim);
      setYazilan(n);
      sayacRef.current += 1;
      if (sayacRef.current % 8 === 0) onIlerleme?.();
      titre.value = withSequence(withTiming(1, { duration: 26 }), withTiming(0, { duration: 80 }));
      if (n >= toplam) {
        clearInterval(saat);
        if (!bittiRef.current) {
          bittiRef.current = true;
          onIlerleme?.();
          onBitti?.();
        }
      }
    }, araAdim);
    return () => clearInterval(saat);
  }, [etkin, toplam, adim, araAdim, titre, onBitti, onIlerleme]);

  useEffect(() => {
    if (!atla || bittiRef.current) return;
    bittiRef.current = true;
    setYazilan(toplam);
    onIlerleme?.();
    onBitti?.();
  }, [atla, toplam, onBitti, onIlerleme]);

  const stil = useAnimatedStyle(() => ({
    transform: [{ translateY: titre.value * -1.4 }],
  }));

  let kalan = yazilan;
  const cizilecek: React.ReactNode[] = [];
  for (let i = 0; i < bloklar.length; i++) {
    if (kalan <= 0) break;
    const b = bloklar[i];
    cizilecek.push(ciz(b, b.metin.slice(0, kalan), i));
    kalan -= b.metin.length;
  }

  return (
    <Animated.View style={stil}>
      <View>{cizilecek}</View>
    </Animated.View>
  );
}
