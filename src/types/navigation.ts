export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: undefined;
  App: undefined;
  OwnerApp: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  VerifyEmail: { email: string };
};

export type HomeStackParamList = {
  HomeScreen: undefined;
  VenueDetail: { venueId: number };
  BranchDetail: { branchId: number };
  Reservation: { venueId: number };
};

export type ExploreStackParamList = {
  ExploreScreen: { sportId?: number } | undefined;
  VenueDetail: { venueId: number };
  BranchDetail: { branchId: number };
  Reservation: { venueId: number };
};

export type BookingsStackParamList = {
  MyBookings: undefined;
  ReservationDetail: { reservationId: number };
};

export type NotificationsStackParamList = {
  NotificationsScreen: undefined;
};

export type ProfileStackParamList = {
  ProfileScreen: undefined;
  EditProfile: undefined;
  FAQs: undefined;
  Blogs: undefined;
  BlogDetail: { blogId: number };
  Terms: undefined;
  Privacy: undefined;
};

// Owner navigation types
export type OwnerDashboardStackParamList = {
  OwnerDashboard: undefined;
};

export type OwnerBranchesStackParamList = {
  OwnerBranchesList: undefined;
  OwnerBranchDetail: { branchId: number };
};

export type OwnerVenuesStackParamList = {
  OwnerVenuesList: undefined;
  OwnerVenueDetail: { venueId: number };
};

export type OwnerReservationsStackParamList = {
  OwnerReservationsList: undefined;
  OwnerReservationDetail: { reservationId: number };
};
