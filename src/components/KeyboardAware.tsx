import { KeyboardAvoidingView, type KeyboardAvoidingViewProps, Platform, StyleSheet } from "react-native";

type Props = KeyboardAvoidingViewProps & {
  offset?: number;
};

const VARSAYILAN_KIP = Platform.OS === "ios" ? ("padding" as const) : undefined;

export function KeyboardAware({ children, style, behavior = VARSAYILAN_KIP, offset = 0, ...rest }: Props) {
  return (
    <KeyboardAvoidingView style={style ?? styles.flex} behavior={behavior} keyboardVerticalOffset={offset} {...rest}>
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
