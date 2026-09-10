import { useIsFocused } from "expo-router";
import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useSharedValue, type SharedValue } from "react-native-reanimated";

const Baglam = createContext(true);
const SVBaglam = createContext<SharedValue<number> | null>(null);

export function useCanli(): boolean {
  return useContext(Baglam);
}

export function useCanliSV(): SharedValue<number> {
  const sv = useContext(SVBaglam);
  const yedek = useSharedValue(1);
  return sv ?? yedek;
}

export function CanliSaglayici({ deger, children }: { deger: boolean; children: ReactNode }) {
  const ust = useContext(Baglam);
  const canli = ust && deger;
  const sv = useSharedValue(canli ? 1 : 0);
  useEffect(() => {
    sv.value = canli ? 1 : 0;
  }, [canli, sv]);
  return (
    <Baglam.Provider value={canli}>
      <SVBaglam.Provider value={sv}>{children}</SVBaglam.Provider>
    </Baglam.Provider>
  );
}

export function EkranCanli({ children }: { children: ReactNode }) {
  const odakta = useIsFocused();
  return <CanliSaglayici deger={odakta}>{children}</CanliSaglayici>;
}
