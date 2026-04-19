# Sportify Mobile V1

React Native mobile app for the Sportify sports venue booking platform.

## Tech Stack

- **Framework**: React Native 0.81.5 with Expo 54.0.0
- **Language**: TypeScript 5.9.2
- **React**: 19.1.0
- **Navigation**: React Navigation 7.x (native-stack + bottom-tabs)
- **State Management**: Zustand 5.0.3
- **HTTP Client**: Axios 1.7.9
- **Animations**: React Native Reanimated 4.1.1
- **Styling**: React Native StyleSheet + custom theme system (NativeWind configured but not used)
- **i18n**: i18next 25.10.9 + react-i18next (English + Arabic)
- **Secure Storage**: Expo Secure Store 15.0.8
- **UI**: Custom component library + Expo Vector Icons

## Commands

```bash
npm start          # Expo start
npm run android    # Start on Android
npm run ios        # Start on iOS
npm run web        # Start on web
```

No test, lint, or type-check scripts configured.

## Project Structure

```
src/
  components/
    ui/                    # Reusable UI (Button, Card, Badge, Input, etc.)
    NotificationsModal.tsx
    ProfileDrawer.tsx
  screens/                 # Screens organized by feature:
    Auth/        Bookings/     Branch/    Explore/
    Home/        LastMoments/  Notifications/ Onboarding/
    Owner/       Profile/      Splash/    Venue/
  navigation/              # Navigation configuration
    RootNavigator.tsx      # Main stack navigator
    AppNavigator.tsx       # Bottom tabs (regular user)
    OwnerAppNavigator.tsx  # Bottom tabs (owner role)
    AuthNavigator.tsx
    CustomTabBar.tsx       # Custom tab bar UI
  stores/                  # Zustand stores
    auth.store.ts          # Auth state, login, register
    theme.store.ts         # Dark mode toggle
    language.store.ts      # Language/locale management
    venues.store.ts        # Venue search + pagination
    branches.store.ts      reservations.store.ts
    notifications.store.ts ui.store.ts
  lib/
    api.ts                 # Axios instance with auth interceptors
    secure-store.ts        # Secure token storage wrapper
    upload.ts              # Image upload utility
  theme/                   # Design system
    colors.ts              # Light & dark color palettes
    spacing.ts             # Spacing, radius, sizes constants
    typography.ts          # Font sizes and weights
    useThemeColors.ts      # Hook for theme-aware colors
  types/
    api.ts                 # API models (User, Branch, Venue, etc.)
    auth.ts                # Auth types
    navigation.ts          # Navigation param lists
  constants/               # Static data (countries, onboarding, tabs)
  i18n/                    # i18next setup + translation JSON files (en, ar)
  utils/                   # Helper functions
```

## Key Conventions

### Two User Roles
- **Regular users**: `AppNavigator` (bottom tabs: Home, Explore, Bookings, Profile)
- **Business owners**: `OwnerAppNavigator` (owner-specific navigation)

### State Management
- Zustand stores: `create<StoreInterface>((set, get) => ({ ... }))`
- Stores contain state + async API methods
- `error` and loading state fields for async operations
- Auth store hydrates from secure storage on app launch

### API Layer
- Centralized Axios instance in `src/lib/api.ts`
- Request interceptor: auto-attaches Bearer token from secure store
- Response interceptor: unwraps backend envelope `{ data, message }`
- 401 handling: token refresh with queued request retry

### Styling
- **React Native StyleSheet** (not NativeWind/className)
- Custom theme in `src/theme/colors.ts` (lightColors, darkColors)
- `useThemeColors()` hook for dynamic theme-aware styling
- Spacing/radius/typography constants in `src/theme/`
- Dark mode managed via Zustand store with AsyncStorage persistence

### Navigation
- React Navigation native-stack + bottom-tabs
- Custom tab bar component (CustomTabBar.tsx)
- Type-safe navigation params in `src/types/navigation.ts`
- Separate navigators per user role

### i18n
- i18next with device locale detection (expo-localization)
- Fallback to English
- Translation files: `src/i18n/en.json`, `src/i18n/ar.json`

## Path Aliases

- `@/*` -> `src/*`

## App Config (app.json)

- Bundle ID: `com.sportify.app` (iOS + Android)
- Orientation: portrait
- Primary color: #00C16A
