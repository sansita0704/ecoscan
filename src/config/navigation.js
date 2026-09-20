import { BookOpen, Home, MapPin, MessageCircle, ScanLine, Trophy } from "lucide-react";

/**
 * `id` values are the view keys used by App. The previous Scanner / Disposal Map
 * / Analytics / Leaderboard views are all still reachable: Analytics and
 * Leaderboard were merged into Impact.
 */
export const NAV_ITEMS = [
  { id: "home", label: "Home", icon: Home },
  { id: "scanner", label: "Scan Waste", icon: ScanLine },
  { id: "guide", label: "Waste Guide", icon: BookOpen },
  { id: "facilities", label: "Facilities", icon: MapPin },
  { id: "chat", label: "AI Chat", icon: MessageCircle },
  { id: "impact", label: "My Impact", icon: Trophy },
];

/**
 * Bottom bar on phones. "Home" is left out because its own shortcut (the
 * logo in Header) is always on screen there; every other section, including
 * this new one, needs a slot here to be reachable at all on mobile.
 */
export const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((n) => n.id !== "home");
