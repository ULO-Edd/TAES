import { View, Text, StyleSheet, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface AlertBannerProps {
  type?: "info" | "warning" | "error" | "success";
  message?: string;
  onClose?: () => void;
}

const getBannerStyle = (type: string) => {
  switch (type) {
    case "warning":
      return {
        style: styles.warningBanner,
        iconName: "alert-circle" as const,
        iconColor: "#664D03",
        textColor: "#664D03",
      };
    case "info":
      return {
        style: styles.infoBanner,
        iconName: "information" as const,
        iconColor: "#0C5460",
        textColor: "#0C5460",
      };
    case "error":
      return {
        style: styles.errorBanner,
        iconName: "alert-octagon" as const,
        iconColor: "#721C24",
        textColor: "#721C24",
      };
    case "success":
      return {
        style: styles.successBanner,
        iconName: "check-circle" as const,
        iconColor: "#155724",
        textColor: "#155724",
      };
    default:
      return {
        style: styles.infoBanner,
        iconName: "information" as const,
        iconColor: "#0C5460",
        textColor: "#0C5460",
      };
  }
};

export default function AlertBanner(props: AlertBannerProps) {
  const bannerType = getBannerStyle(props.type || "info");

  return (
    <View style={[styles.baseBanner, bannerType.style]} testID="alert-banner">
      <MaterialCommunityIcons
        name={bannerType.iconName}
        size={24}
        color={bannerType.iconColor}
        testID="alert-banner-icon"
      />
      <Text
        style={[styles.bannerText, { color: bannerType.textColor }]}
        testID="alert-banner-message"
      >
        {props.message || "This is an alert banner!"}
      </Text>
      {props.onClose && (
        <Pressable onPress={props.onClose} testID="alert-banner-close-button">
          <MaterialCommunityIcons
            name="close"
            size={20}
            color={bannerType.iconColor}
            testID="alert-banner-close-icon"
          />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  baseBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
  },

  warningBanner: {
    backgroundColor: "#FFFF00",
    borderColor: "#FFFF00",
    borderWidth: 1,
  },

  bannerText: {
    marginLeft: 10,
    flex: 1,
  },

  infoBanner: {
    backgroundColor: "#D1ECF1",
    borderColor: "#BEE5EB",
    borderWidth: 1,
  },
  errorBanner: {
    backgroundColor: "#F8D7DA",
    borderColor: "#F5C6CB",
    borderWidth: 1,
  },
  successBanner: {
    backgroundColor: "#D4EDDA",
    borderColor: "#C3E6CB",
    borderWidth: 1,
  },
});
