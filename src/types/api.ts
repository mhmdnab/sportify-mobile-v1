export enum Day {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  PLAYED = 'PLAYED',
  PAID = 'PAID',
}

export enum EntityType {
  RESERVATION = 'RESERVATION',
  BRANCH = 'BRANCH',
  VENUE = 'VENUE',
  USER = 'USER',
}

export interface Address {
  id?: number;
  latitude: number;
  longitude: number;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  image: string;
  isDeleted: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  address?: Address;
  admin?: Admin;
  owner?: Owner;
  coach?: Coach;
}

export interface Admin {
  id: number;
}

export interface Owner {
  id: number;
  packageId: number;
  package?: Package;
}

export interface Coach {
  id: number;
}

export interface Package {
  id: number;
  name: string;
  description: string;
  image: string;
  price: number;
  branchCount: number;
  venueCount: number;
}

export interface Sport {
  id: number;
  name: string;
  description: string;
  image: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: number;
  sportId: number;
  ownerId: number;
  name: string;
  phone: string;
  images: string[];
  isFeatured: boolean;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  address?: Address;
  sport?: Sport;
  owner?: Owner;
  venues?: Venue[];
  facilities?: Facility[];
}

export interface Venue {
  id: number;
  branchId: number;
  name: string;
  images: string[];
  playerCapacity: number;
  isTop: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  branch?: Branch;
  availability?: Availability[];
  venueTypes?: VenueType[];
}

export interface VenueType {
  id: number;
  name: string;
  sportId?: number;
  sport?: Sport;
}

export interface Availability {
  id: number;
  venueId: number;
  day: Day;
  startTime: string;
  endTime: string;
  isOpen: boolean;
  slots?: Slot[];
}

export interface Slot {
  id: number;
  availabilityId: number;
  startTime: string;
  endTime: string;
  price: number;
}

export interface Reservation {
  id: number;
  slotId: number;
  userId: number;
  repeatCount: number;
  notes?: string;
  status: ReservationStatus;
  slotDate: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  slot?: Slot & { availability?: Availability & { venue?: Venue } };
  user?: User;
}

export interface Facility {
  id: number;
  name: string;
  branchId: number;
  typeId: number;
  images: string[];
  isDeleted: boolean;
  type?: FacilityType;
}

export interface FacilityType {
  id: number;
  name: string;
  image: string;
}

export interface Notification {
  id: number;
  userId: number;
  message: string;
  entityId?: number;
  entityType?: EntityType;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Blog {
  id: number;
  title: string;
  subtitle?: string;
  content: string;
  image?: string;
  isPublished: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Faq {
  id: number;
  question: string;
  answer: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PrivacyPolicy {
  id: number;
  title: string;
  content: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TermAndCondition {
  id: number;
  title: string;
  content: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  page: number;
  limit: number;
  total: number;
  filteredTotal: number;
  totalPages: number;
  hasNext: boolean;
  list: T[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  key?: string;
  order?: 'asc' | 'desc';
  column?: string;
}
