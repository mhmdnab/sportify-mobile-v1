import { Ionicons } from "@expo/vector-icons";

export interface TabConfig {
  name: string;
  labelKey: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}

export const tabs: TabConfig[] = [
  {
    name: "HomeTab",
    labelKey: "tabs.home",
    icon: "home-outline",
    activeIcon: "home",
  },
  {
    name: "ExploreTab",
    labelKey: "tabs.search",
    icon: "search-outline",
    activeIcon: "search",
  },
  {
    name: "ShopTab",
    labelKey: "Shop",
    icon: "bag-outline",
    activeIcon: "bag-handle",
  },
  {
    name: "BookingsTab",
    labelKey: "tabs.schedule",
    icon: "calendar-outline",
    activeIcon: "calendar",
  },
  {
    name: "ProfileTab",
    labelKey: "tabs.profile",
    icon: "person-outline",
    activeIcon: "person",
  },
];
