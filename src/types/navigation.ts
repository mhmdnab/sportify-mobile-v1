export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: undefined;
  App: undefined;
  OwnerApp: undefined;
  ManagerApp: undefined;
  CoachApp: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  VerifyEmail: { email: string };
};

export type HomeStackParamList = {
  HomeScreen: undefined;
  VenueDetail: { venueId: number; preselectedCoachId?: number };
  BranchDetail: { branchId: number; preselectedCoachId?: number };
  Reservation: { venueId: number; preselectedCoachId?: number };
  StadiumsScreen: undefined;
  CoachesList: undefined;
  CoachProfile: { coachId: number };
  CoachVenueAvailability: { coachId: number; venueId: number; venueName?: string };
};

export type ExploreStackParamList = {
  ExploreScreen: { sportId?: number } | undefined;
  VenueDetail: { venueId: number; preselectedCoachId?: number };
  BranchDetail: { branchId: number; preselectedCoachId?: number };
  Reservation: { venueId: number; preselectedCoachId?: number };
  CoachesList: undefined;
  CoachProfile: { coachId: number };
  CoachVenueAvailability: { coachId: number; venueId: number; venueName?: string };
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
  ChangePassword: undefined;
  MyReservations: undefined;
  ReservationDetail: { reservationId: number };
  FAQs: undefined;
  Blogs: undefined;
  BlogDetail: { blogId: number };
  Terms: undefined;
  Privacy: undefined;
};

// Owner navigation types
export type OwnerDashboardStackParamList = {
  OwnerDashboard: undefined;
  MyVenuesScreen: undefined;
  VenueDetail: { venueId: number };
  Reservation: { venueId: number; venueName?: string };
  BranchDetail: { branchId: number };
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

export type OwnerScheduleStackParamList = {
  OwnerSchedule: undefined;
};

// Manager navigation types
export type ManagerDashboardStackParamList = {
  ManagerDashboard: undefined;
  MyVenuesScreen: undefined;
  VenueDetail: { venueId: number };
  Reservation: { venueId: number; venueName?: string };
  BranchDetail: { branchId: number };
};

export type ManagerReservationsStackParamList = {
  ManagerReservationsList: undefined;
  ManagerReservationDetail: { reservationId: number };
};

export type ManagerClientsStackParamList = {
  ManagerClients: undefined;
  ManagerClientDetail: {
    userId: number;
    name: string;
    email: string;
    phone: string | null;
    totalReservations: number;
    totalCancellations: number;
    totalPaid: number;
    totalRevenue: number;
  };
};

export type ManagerScheduleStackParamList = {
  ManagerSchedule: undefined;
};

// Coach navigation types
export type CoachDashboardStackParamList = {
  CoachDashboard: undefined;
  StadiumsScreen: undefined;
  VenueDetail: { venueId: number };
  BranchDetail: { branchId: number };
  Reservation: { venueId: number };
  ReservationDetail: { reservationId: number };
};

export type CoachBookingsStackParamList = {
  CoachBookingsList: undefined;
  CoachBookingDetail: { reservationId: number };
};

export type CoachScheduleStackParamList = {
  CoachSchedule: undefined;
};

export type CoachAvailabilityStackParamList = {
  CoachAvailabilityScreen: undefined;
};
