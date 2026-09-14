import { type ReactNode } from "react";
import { Modal, Pressable, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";

import { KeyboardAware } from "@/components/KeyboardAware";
import { ModalKok } from "@/components/ModalKok";

export function CenterModal({
  visible,
  onClose,
  children,
  dim = 0.62,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  dim?: number;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <ModalKok>
        <KeyboardAware>
          <Pressable style={[styles.center, { backgroundColor: `rgba(3,3,8,${dim})` }]} onPress={onClose}>
            <Animated.View style={styles.wrap}>
              <Pressable>{children}</Pressable>
            </Animated.View>
          </Pressable>
        </KeyboardAware>
      </ModalKok>
    </Modal>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, paddingVertical: 28 },
  wrap: { width: "100%", maxWidth: 320, alignItems: "stretch" },
});
