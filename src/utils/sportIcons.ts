import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

type IonIconName = keyof typeof Ionicons.glyphMap;
type MCIconName = keyof typeof MaterialCommunityIcons.glyphMap;

export type SportIcon =
  | { library: 'ionicons'; name: IonIconName }
  | { library: 'material-community'; name: MCIconName };

const SPORT_ICON_MAP: Record<string, SportIcon> = {
  football: { library: 'ionicons', name: 'football-outline' },
  soccer: { library: 'ionicons', name: 'football-outline' },
  basketball: { library: 'ionicons', name: 'basketball-outline' },
  tennis: { library: 'material-community', name: 'tennis' },
  padel: { library: 'ionicons', name: 'tennisball-outline' },
  badminton: { library: 'material-community', name: 'badminton' },
  volleyball: { library: 'ionicons', name: 'basketball-outline' },
  cricket: { library: 'material-community', name: 'cricket' },
  baseball: { library: 'ionicons', name: 'baseball-outline' },
  swimming: { library: 'ionicons', name: 'water-outline' },
  golf: { library: 'ionicons', name: 'golf-outline' },
  rugby: { library: 'ionicons', name: 'american-football-outline' },
  'american football': { library: 'ionicons', name: 'american-football-outline' },
  bowling: { library: 'ionicons', name: 'bowling-ball-outline' },
  fitness: { library: 'ionicons', name: 'fitness-outline' },
  gym: { library: 'ionicons', name: 'barbell-outline' },
  running: { library: 'ionicons', name: 'walk-outline' },
  cycling: { library: 'ionicons', name: 'bicycle-outline' },
  boxing: { library: 'material-community', name: 'boxing-glove' },
  martial: { library: 'ionicons', name: 'body-outline' },
  hockey: { library: 'material-community', name: 'hockey-sticks' },
  table: { library: 'material-community', name: 'table-tennis' },
  ping: { library: 'material-community', name: 'table-tennis' },
};

export function getSportIcon(sportName: string): SportIcon {
  const lower = sportName.toLowerCase();
  for (const [key, icon] of Object.entries(SPORT_ICON_MAP)) {
    if (lower.includes(key)) return icon;
  }
  return { library: 'ionicons', name: 'trophy-outline' };
}
