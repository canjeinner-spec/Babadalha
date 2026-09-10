import { memo, type ReactNode } from "react";
import Svg, { Path } from "react-native-svg";

import { I, type IconName } from "./paths";
import { renderSay } from "@/lib/takilma/sayac";

type IconProps = {
  name?: IconName;
  path?: string;
  size?: number;
  sw?: number;
  color?: string;
  fill?: string;
  children?: ReactNode;
};

function IconTaban({ name, path, size = 20, sw = 1.7, color = "#F4F2EE", fill = "none", children }: IconProps) {
  renderSay("Icon");
  const d = path ?? (name ? I[name] : undefined);
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {d ? <Path d={d} /> : children}
    </Svg>
  );
}

export const Icon = memo(IconTaban);
