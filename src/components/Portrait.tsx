import { Image } from "expo-image";
import { memo, useId, useState } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Ellipse, Path, RadialGradient, Rect, Stop } from "react-native-svg";

import { Icon } from "@/icons/Icon";
import { PEOPLE } from "@/data/people";
import { C } from "@/theme/colors";
import { kucukGorsel } from "@/lib/gorsel";
import { renderSay } from "@/lib/takilma/sayac";

type PortraitProps = {
  name: string;
  size?: number;
  ring?: string;
  glow?: boolean;
  muted?: boolean;
  online?: boolean;
  frameBorder?: string;
  photo?: string;
  halkasiz?: boolean;
};

function PortraitTaban({
  name,
  size = 56,
  ring,
  glow,
  muted,
  online,
  frameBorder = C.bg,
  photo,
  halkasiz,
}: PortraitProps) {
  renderSay("Portrait");
  const p = PEOPLE[name] || PEOPLE.Sen;
  const src = photo || p.photo;
  const [imgOk, setImgOk] = useState(true);
  const [tamBoy, setTamBoy] = useState(false);
  const [oncekiSrc, setOncekiSrc] = useState(src);
  if (oncekiSrc !== src) {
    setOncekiSrc(src);
    setImgOk(true);
    setTamBoy(false);
  }
  const kaynak = tamBoy ? src : (kucukGorsel(src, size) ?? src);
  const gid = "pg" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const halkaVar = !halkasiz && !!ring && ring !== "transparent";
  const ringColor = ring || "rgba(255,255,255,.14)";
  const fotoVar = !!src && imgOk;

  const hale = Math.max(3, Math.round(size * 0.085));
  const haleRengi = (ring && /^#[0-9a-fA-F]{6}$/.test(ring) ? ring : C.gold) + "2E";

  return (
    <View style={{ width: size, height: size }}>
      {glow && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: -hale,
            right: -hale,
            top: -hale,
            bottom: -hale,
            borderRadius: (size + hale * 2) / 2,
            backgroundColor: haleRengi,
          }}
        />
      )}

      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: halkaVar ? 2 : 0,
          borderColor: halkaVar ? ringColor : "transparent",
        }}
      >
        <View style={{ flex: 1, borderRadius: (size - (halkaVar ? 4 : 0)) / 2, overflow: "hidden", backgroundColor: p.bg[1] }}>
        {!fotoVar && (
        <Svg viewBox="0 0 100 100" width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <RadialGradient id={gid} cx="50%" cy="32%" r="120%">
            <Stop offset="0%" stopColor={p.bg[0]} />
            <Stop offset="100%" stopColor={p.bg[1]} />
          </RadialGradient>
          <Rect width={100} height={100} fill={`url(#${gid})`} />
          <Circle cx={78} cy={20} r={3} fill={p.acc} opacity={0.5} />
          <Circle cx={22} cy={32} r={2} fill="#fff" opacity={0.25} />
          <Circle cx={68} cy={42} r={1.6} fill="#fff" opacity={0.2} />
          <Path d="M13 102 C13 76 31 65 50 65 C69 65 87 76 87 102 Z" fill="#0D0B12" />
          <Rect x={43} y={52} width={14} height={14} rx={4} fill="#0D0B12" />
          <Ellipse cx={50} cy={41} rx={16.5} ry={18.5} fill="#0D0B12" />
          <Ellipse cx={50} cy={31} rx={17.5} ry={13.5} fill={p.hair} />
          {p.style === "long" && (
            <>
              <Path d="M33.5 36 C30 54 31 64 26 74 C36 71 40 58 38 42 Z" fill={p.hair} />
              <Path d="M66.5 36 C70 54 69 64 74 74 C64 71 60 58 62 42 Z" fill={p.hair} />
            </>
          )}
          <Path d="M62 27 C67.5 33 68 48 63.5 57" stroke={p.acc} strokeWidth={1.6} fill="none" opacity={0.85} strokeLinecap="round" />
          <Path d="M70 70 C79 75 84 86 85.5 100" stroke={p.acc} strokeWidth={1.6} fill="none" opacity={0.5} strokeLinecap="round" />
        </Svg>
        )}

        {fotoVar && (
          <Image
            source={{ uri: kaynak }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={0}
            recyclingKey={kaynak}
            onError={() => { if (tamBoy || kaynak === src) setImgOk(false); else setTamBoy(true); }}
          />
        )}
        </View>
      </View>

      {muted && (
        <View
          style={[
            styles.badge,
            {
              width: size * 0.34,
              height: size * 0.34,
              borderRadius: (size * 0.34) / 2,
              bottom: 0,
              right: 0,
              borderColor: frameBorder,
              borderWidth: 2,
            },
          ]}
        >
          <Icon name="micOff" size={size * 0.19} sw={2} color="#D9D7E0" />
        </View>
      )}

      {online && (
        <View
          style={{
            position: "absolute",
            ...(muted ? { top: size * 0.02 } : { bottom: size * 0.02 }),
            right: size * 0.02,
            width: size * 0.26,
            height: size * 0.26,
            borderRadius: (size * 0.26) / 2,
            backgroundColor: C.green,
            borderWidth: 2.5,
            borderColor: frameBorder,
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    backgroundColor: "rgba(8,8,14,.85)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.18)",
    alignItems: "center",
    justifyContent: "center",
  },
});

export const Portrait = memo(PortraitTaban);
