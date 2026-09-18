/**
 * Nike earn — API type schemas
 */
export interface HealthStatus {
  status: string;
}

export interface MessageResponse {
  message: string;
}

export interface ErrorResponse {
  error: string;
}

export interface RegisterBody {
  email: string;
  /**
   * @minLength 3
   * @maxLength 30
   */
  username: string;
  /** @minLength 8 */
  password: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface ForgotPasswordBody {
  email: string;
}

export interface ResetPasswordBody {
  token: string;
  /** @minLength 8 */
  password: string;
}

export type UserProfileStatus =
  (typeof UserProfileStatus)[keyof typeof UserProfileStatus];

export const UserProfileStatus = {
  active: "active",
  disabled: "disabled",
  unverified: "unverified",
} as const;

export interface UserProfile {
  id: number;
  email: string;
  username: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  status: UserProfileStatus;
  createdAt: string;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
}

export type UserWithBalance = UserProfile & {
  balance: string;
  totalEarned: string;
  totalWithdrawn: string;
};

export interface BalanceResponse {
  balance: string;
  totalEarned: string;
  totalWithdrawn: string;
  pendingWithdrawals: string;
}

export type TransactionType = "earning" | "withdrawal" | "adjustment" | "refund";
export type TransactionStatus = "completed" | "pending" | "failed";
export type WithdrawalStatus = "pending" | "approved" | "rejected" | "paid";
export type WithdrawalNetwork = "BEP20" | "TRC20" | "SHAM_CASH" | "SYRIATEL_CASH" | "COENEX_EMAIL";
export type PlatformPlacement = "homepage" | "sidebar" | "dedicated";
export type AdminRole = "admin" | "super_admin";
export type UserStatus = "active" | "disabled" | "unverified";

export interface Transaction {
  id: number;
  userId: number;
  type: TransactionType;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  description: string;
  status: TransactionStatus;
  createdAt: string;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
}

export interface Withdrawal {
  id: number;
  userId: number;
  amount: string;
  network: WithdrawalNetwork;
  walletAddress: string;
  status: WithdrawalStatus;
  adminNote?: string | null;
  txHash?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WithdrawalListResponse {
  withdrawals: Withdrawal[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateWithdrawalBody {
  amount: string;
  network: WithdrawalNetwork;
  walletAddress: string;
}

export interface UpdateWithdrawalStatusBody {
  status: "approved" | "rejected" | "paid";
  adminNote?: string;
  txHash?: string;
}

export interface Platform {
  id: number;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  placement: PlatformPlacement;
  isEnabled: boolean;
  createdAt: string;
}

export interface PlatformListResponse {
  platforms: Platform[];
}

export interface CreatePlatformBody {
  name: string;
  description?: string;
  logoUrl?: string;
  apiKey?: string;
  apiEndpoint?: string;
  secretKey?: string;
  placement: PlatformPlacement;
  isEnabled?: boolean;
}

export interface UpdatePlatformBody {
  name?: string;
  description?: string;
  logoUrl?: string;
  apiKey?: string;
  apiEndpoint?: string;
  secretKey?: string;
  placement?: PlatformPlacement;
  isEnabled?: boolean;
}

export interface Admin {
  id: number;
  userId: number;
  email: string;
  username: string;
  role: AdminRole;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
}

export interface AdminListResponse {
  admins: Admin[];
}

export interface CreateAdminBody {
  userId: number;
  role: AdminRole;
  permissions?: string[];
}

export interface UpdateAdminBody {
  role?: AdminRole;
  permissions?: string[];
  isActive?: boolean;
}

export interface UpdateUserBody {
  username?: string;
  status?: "active" | "disabled";
  isAdmin?: boolean;
}

export interface AdjustBalanceBody {
  amount: string;
  reason: string;
}

export interface UserListResponse {
  users: UserWithBalance[];
  total: number;
  page: number;
  limit: number;
}

export interface DashboardStats {
  balance: string;
  totalEarned: string;
  totalWithdrawn: string;
  pendingWithdrawals: string;
  completedOffers: number;
  recentEarnings: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalPlatforms: number;
  pendingWithdrawals: number;
  totalWithdrawnAllTime: string;
  totalBalanceInSystem: string;
  newUsersToday: number;
  withdrawalsToday: number;
}

export interface RecentActivityResponse {
  activities: {
    id: number;
    type: string;
    description: string;
    amount?: string | null;
    createdAt: string;
  }[];
}

export interface UpdateProfileBody {
  username?: string;
}

export interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: UserStatus;
}

export interface ListTransactionsParams {
  page?: number;
  limit?: number;
  type?: TransactionType;
}

export interface ListAllTransactionsParams {
  page?: number;
  limit?: number;
  userId?: number;
  type?: string;
}

export interface ListWithdrawalsParams {
  page?: number;
  limit?: number;
}

export interface ListAllWithdrawalsParams {
  page?: number;
  limit?: number;
  status?: WithdrawalStatus;
  userId?: number;
}
