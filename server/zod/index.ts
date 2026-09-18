/**
 * Foxe Earn — Zod validation schemas
 */
import * as zod from "zod";

/**
 * @summary Health check
 */
export const HealthCheckResponse = zod.object({
  status: zod.string(),
});

/**
 * @summary Register — create account directly with email, username and password
 */
export const registerBodyUsernameMin = 3;
export const registerBodyUsernameMax = 30;
export const registerBodyPasswordMin = 8;

export const RegisterBody = zod.object({
  email: zod.string().email(),
  username: zod
    .string()
    .min(registerBodyUsernameMin)
    .max(registerBodyUsernameMax),
  password: zod.string().min(registerBodyPasswordMin),
});

export const RegisterResponse = zod.object({
  user: zod.object({
    id: zod.number(),
    email: zod.string(),
    username: zod.string(),
    isAdmin: zod.boolean(),
    isSuperAdmin: zod.boolean(),
    status: zod.enum(["active", "disabled", "unverified"]),
    createdAt: zod.coerce.date(),
  }),
  token: zod.string(),
});

/**
 * @summary Login with email and password
 */
export const LoginBody = zod.object({
  email: zod.string().email(),
  password: zod.string(),
});

export const LoginResponse = zod.object({
  user: zod.object({
    id: zod.number(),
    email: zod.string(),
    username: zod.string(),
    isAdmin: zod.boolean(),
    isSuperAdmin: zod.boolean(),
    status: zod.enum(["active", "disabled", "unverified"]),
    createdAt: zod.coerce.date(),
  }),
  token: zod.string(),
});

/**
 * @summary Logout current session
 */
export const LogoutResponse = zod.object({
  message: zod.string(),
});

/**
 * @summary Request password reset email
 */
export const ForgotPasswordBody = zod.object({
  email: zod.string().email(),
});

export const ForgotPasswordResponse = zod.object({
  message: zod.string(),
});

/**
 * @summary Reset password with token
 */
export const resetPasswordBodyPasswordMin = 8;

export const ResetPasswordBody = zod.object({
  token: zod.string(),
  password: zod.string().min(resetPasswordBodyPasswordMin),
});

export const ResetPasswordResponse = zod.object({
  message: zod.string(),
});

/**
 * @summary Get current authenticated user
 */
export const GetMeResponse = zod.object({
  id: zod.number(),
  email: zod.string(),
  username: zod.string(),
  isAdmin: zod.boolean(),
  isSuperAdmin: zod.boolean(),
  status: zod.enum(["active", "disabled", "unverified"]),
  createdAt: zod.coerce.date(),
});

/**
 * @summary List all users (admin)
 */
export const listUsersQueryPageDefault = 1;
export const listUsersQueryLimitDefault = 20;

export const ListUsersQueryParams = zod.object({
  page: zod.coerce.number().default(listUsersQueryPageDefault),
  limit: zod.coerce.number().default(listUsersQueryLimitDefault),
  search: zod.coerce.string().optional(),
  status: zod.enum(["active", "disabled", "unverified"]).optional(),
});

export const ListUsersResponse = zod.object({
  users: zod.array(
    zod
      .object({
        id: zod.number(),
        email: zod.string(),
        username: zod.string(),
        isAdmin: zod.boolean(),
        isSuperAdmin: zod.boolean(),
        status: zod.enum(["active", "disabled", "unverified"]),
        createdAt: zod.coerce.date(),
      })
      .and(
        zod.object({
          balance: zod.string(),
          totalEarned: zod.string(),
          totalWithdrawn: zod.string(),
        }),
      ),
  ),
  total: zod.number(),
  page: zod.number(),
  limit: zod.number(),
});

/**
 * @summary Get user by ID (admin)
 */
export const GetUserParams = zod.object({
  userId: zod.coerce.number(),
});

export const GetUserResponse = zod
  .object({
    id: zod.number(),
    email: zod.string(),
    username: zod.string(),
    isAdmin: zod.boolean(),
    isSuperAdmin: zod.boolean(),
    status: zod.enum(["active", "disabled", "unverified"]),
    createdAt: zod.coerce.date(),
  })
  .and(
    zod.object({
      balance: zod.string(),
      totalEarned: zod.string(),
      totalWithdrawn: zod.string(),
    }),
  );

/**
 * @summary Update user (admin)
 */
export const UpdateUserParams = zod.object({
  userId: zod.coerce.number(),
});

export const UpdateUserBody = zod.object({
  username: zod.string().optional(),
  status: zod.enum(["active", "disabled"]).optional(),
  isAdmin: zod.boolean().optional(),
});

export const UpdateUserResponse = zod
  .object({
    id: zod.number(),
    email: zod.string(),
    username: zod.string(),
    isAdmin: zod.boolean(),
    isSuperAdmin: zod.boolean(),
    status: zod.enum(["active", "disabled", "unverified"]),
    createdAt: zod.coerce.date(),
  })
  .and(
    zod.object({
      balance: zod.string(),
      totalEarned: zod.string(),
      totalWithdrawn: zod.string(),
    }),
  );

/**
 * @summary Adjust user balance (admin)
 */
export const AdjustUserBalanceParams = zod.object({
  userId: zod.coerce.number(),
});

export const AdjustUserBalanceBody = zod.object({
  amount: zod.string().describe("Positive to add, negative to subtract"),
  reason: zod.string(),
});

export const AdjustUserBalanceResponse = zod.object({
  message: zod.string(),
});

/**
 * @summary Get current user balance
 */
export const GetBalanceResponse = zod.object({
  balance: zod.string(),
  totalEarned: zod.string(),
  totalWithdrawn: zod.string(),
  pendingWithdrawals: zod.string(),
});

/**
 * @summary Get transaction history for current user
 */
export const listTransactionsQueryPageDefault = 1;
export const listTransactionsQueryLimitDefault = 20;

export const ListTransactionsQueryParams = zod.object({
  page: zod.coerce.number().default(listTransactionsQueryPageDefault),
  limit: zod.coerce.number().default(listTransactionsQueryLimitDefault),
  type: zod.enum(["earning", "withdrawal", "adjustment", "refund"]).optional(),
});

export const ListTransactionsResponse = zod.object({
  transactions: zod.array(
    zod.object({
      id: zod.number(),
      userId: zod.number(),
      type: zod.enum(["earning", "withdrawal", "adjustment", "refund"]),
      amount: zod.string(),
      balanceBefore: zod.string(),
      balanceAfter: zod.string(),
      description: zod.string(),
      status: zod.enum(["completed", "pending", "failed"]),
      createdAt: zod.coerce.date(),
    }),
  ),
  total: zod.number(),
  page: zod.number(),
  limit: zod.number(),
});

/**
 * @summary List all transactions (admin)
 */
export const listAllTransactionsQueryPageDefault = 1;
export const listAllTransactionsQueryLimitDefault = 50;

export const ListAllTransactionsQueryParams = zod.object({
  page: zod.coerce.number().default(listAllTransactionsQueryPageDefault),
  limit: zod.coerce.number().default(listAllTransactionsQueryLimitDefault),
  userId: zod.coerce.number().optional(),
  type: zod.coerce.string().optional(),
});

export const ListAllTransactionsResponse = zod.object({
  transactions: zod.array(
    zod.object({
      id: zod.number(),
      userId: zod.number(),
      type: zod.enum(["earning", "withdrawal", "adjustment", "refund"]),
      amount: zod.string(),
      balanceBefore: zod.string(),
      balanceAfter: zod.string(),
      description: zod.string(),
      status: zod.enum(["completed", "pending", "failed"]),
      createdAt: zod.coerce.date(),
    }),
  ),
  total: zod.number(),
  page: zod.number(),
  limit: zod.number(),
});

/**
 * @summary Get withdrawal history for current user
 */
export const listWithdrawalsQueryPageDefault = 1;
export const listWithdrawalsQueryLimitDefault = 20;

export const ListWithdrawalsQueryParams = zod.object({
  page: zod.coerce.number().default(listWithdrawalsQueryPageDefault),
  limit: zod.coerce.number().default(listWithdrawalsQueryLimitDefault),
});

export const ListWithdrawalsResponse = zod.object({
  withdrawals: zod.array(
    zod.object({
      id: zod.number(),
      userId: zod.number(),
      amount: zod.string(),
      network: zod.enum(["BEP20", "TRC20", "SHAM_CASH", "SYRIATEL_CASH", "COENEX_EMAIL"]),
      walletAddress: zod.string(),
      status: zod.enum(["pending", "approved", "rejected", "paid"]),
      adminNote: zod.string().nullish(),
      txHash: zod.string().nullish(),
      createdAt: zod.coerce.date(),
      updatedAt: zod.coerce.date(),
    }),
  ),
  total: zod.number(),
  page: zod.number(),
  limit: zod.number(),
});

/**
 * @summary Submit withdrawal request
 */
export const CreateWithdrawalBody = zod.object({
  amount: zod.string(),
  network: zod.enum(["BEP20", "TRC20", "SHAM_CASH", "SYRIATEL_CASH", "COENEX_EMAIL"]),
  walletAddress: zod.string(),
});

export const CreateWithdrawalResponse = zod.object({
  id: zod.number(),
  userId: zod.number(),
  amount: zod.string(),
  network: zod.enum(["BEP20", "TRC20", "SHAM_CASH", "SYRIATEL_CASH", "COENEX_EMAIL"]),
  walletAddress: zod.string(),
  status: zod.enum(["pending", "approved", "rejected", "paid"]),
  adminNote: zod.string().nullish(),
  txHash: zod.string().nullish(),
  createdAt: zod.coerce.date(),
  updatedAt: zod.coerce.date(),
});

/**
 * @summary List all withdrawals (admin)
 */
export const listAllWithdrawalsQueryPageDefault = 1;
export const listAllWithdrawalsQueryLimitDefault = 50;

export const ListAllWithdrawalsQueryParams = zod.object({
  page: zod.coerce.number().default(listAllWithdrawalsQueryPageDefault),
  limit: zod.coerce.number().default(listAllWithdrawalsQueryLimitDefault),
  status: zod.enum(["pending", "approved", "rejected", "paid"]).optional(),
  userId: zod.coerce.number().optional(),
});

export const ListAllWithdrawalsResponse = zod.object({
  withdrawals: zod.array(
    zod.object({
      id: zod.number(),
      userId: zod.number(),
      amount: zod.string(),
      network: zod.enum(["BEP20", "TRC20", "SHAM_CASH", "SYRIATEL_CASH", "COENEX_EMAIL"]),
      walletAddress: zod.string(),
      status: zod.enum(["pending", "approved", "rejected", "paid"]),
      adminNote: zod.string().nullish(),
      txHash: zod.string().nullish(),
      createdAt: zod.coerce.date(),
      updatedAt: zod.coerce.date(),
    }),
  ),
  total: zod.number(),
  page: zod.number(),
  limit: zod.number(),
});

/**
 * @summary Update withdrawal status (admin)
 */
export const UpdateWithdrawalStatusParams = zod.object({
  withdrawalId: zod.coerce.number(),
});

export const UpdateWithdrawalStatusBody = zod.object({
  status: zod.enum(["approved", "rejected", "paid"]),
  adminNote: zod.string().optional(),
  txHash: zod.string().optional(),
});

export const UpdateWithdrawalStatusResponse = zod.object({
  id: zod.number(),
  userId: zod.number(),
  amount: zod.string(),
  network: zod.enum(["BEP20", "TRC20", "SHAM_CASH", "SYRIATEL_CASH", "COENEX_EMAIL"]),
  walletAddress: zod.string(),
  status: zod.enum(["pending", "approved", "rejected", "paid"]),
  adminNote: zod.string().nullish(),
  txHash: zod.string().nullish(),
  createdAt: zod.coerce.date(),
  updatedAt: zod.coerce.date(),
});

/**
 * @summary List active platforms (for users)
 */
export const ListPlatformsResponse = zod.object({
  platforms: zod.array(
    zod.object({
      id: zod.number(),
      name: zod.string(),
      description: zod.string().nullish(),
      logoUrl: zod.string().nullish(),
      placement: zod.enum(["homepage", "sidebar", "dedicated"]),
      isEnabled: zod.boolean(),
      createdAt: zod.coerce.date(),
    }),
  ),
});

/**
 * @summary Create platform (admin)
 */
export const CreatePlatformBody = zod.object({
  name: zod.string(),
  description: zod.string().optional(),
  logoUrl: zod.string().optional(),
  apiKey: zod.string().optional(),
  apiEndpoint: zod.string().optional(),
  secretKey: zod.string().optional(),
  placement: zod.enum(["homepage", "sidebar", "dedicated"]),
  isEnabled: zod.boolean().optional(),
  // Custom postback param names (optional — built-in aliases used if omitted)
  paramUserId: zod.string().optional(),
  paramAmount: zod.string().optional(),
  paramTxid: zod.string().optional(),
  paramStatus: zod.string().optional(),
});

export const CreatePlatformResponse = zod.object({
  id: zod.number(),
  name: zod.string(),
  description: zod.string().nullish(),
  logoUrl: zod.string().nullish(),
  placement: zod.enum(["homepage", "sidebar", "dedicated"]),
  isEnabled: zod.boolean(),
  createdAt: zod.coerce.date(),
});

/**
 * @summary List all platforms including disabled (admin)
 */
export const ListAllPlatformsResponse = zod.object({
  platforms: zod.array(
    zod.object({
      id: zod.number(),
      name: zod.string(),
      description: zod.string().nullish(),
      logoUrl: zod.string().nullish(),
      placement: zod.enum(["homepage", "sidebar", "dedicated"]),
      isEnabled: zod.boolean(),
      createdAt: zod.coerce.date(),
    }),
  ),
});

/**
 * @summary Update platform (admin)
 */
export const UpdatePlatformParams = zod.object({
  platformId: zod.coerce.number(),
});

export const UpdatePlatformBody = zod.object({
  name: zod.string().optional(),
  description: zod.string().optional(),
  logoUrl: zod.string().optional(),
  apiKey: zod.string().optional(),
  apiEndpoint: zod.string().optional(),
  secretKey: zod.string().optional(),
  placement: zod.enum(["homepage", "sidebar", "dedicated"]).optional(),
  isEnabled: zod.boolean().optional(),
  // Custom postback param names (optional — built-in aliases used if omitted)
  paramUserId: zod.string().optional(),
  paramAmount: zod.string().optional(),
  paramTxid: zod.string().optional(),
  paramStatus: zod.string().optional(),
});

export const UpdatePlatformResponse = zod.object({
  id: zod.number(),
  name: zod.string(),
  description: zod.string().nullish(),
  logoUrl: zod.string().nullish(),
  placement: zod.enum(["homepage", "sidebar", "dedicated"]),
  isEnabled: zod.boolean(),
  createdAt: zod.coerce.date(),
});

/**
 * @summary Delete platform (admin)
 */
export const DeletePlatformParams = zod.object({
  platformId: zod.coerce.number(),
});

export const DeletePlatformResponse = zod.object({
  message: zod.string(),
});

/**
 * @summary List all admins (super admin)
 */
export const ListAdminsResponse = zod.object({
  admins: zod.array(
    zod.object({
      id: zod.number(),
      userId: zod.number(),
      email: zod.string(),
      username: zod.string(),
      role: zod.enum(["admin", "super_admin"]),
      permissions: zod.array(zod.string()),
      isActive: zod.boolean(),
      createdAt: zod.coerce.date(),
    }),
  ),
});

/**
 * @summary Add admin (super admin)
 */
export const CreateAdminBody = zod.object({
  userId: zod.number(),
  role: zod.enum(["admin", "super_admin"]),
  permissions: zod.array(zod.string()).optional(),
});

export const CreateAdminResponse = zod.object({
  id: zod.number(),
  userId: zod.number(),
  email: zod.string(),
  username: zod.string(),
  role: zod.enum(["admin", "super_admin"]),
  permissions: zod.array(zod.string()),
  isActive: zod.boolean(),
  createdAt: zod.coerce.date(),
});

/**
 * @summary Update admin role/status (super admin)
 */
export const UpdateAdminParams = zod.object({
  adminId: zod.coerce.number(),
});

export const UpdateAdminBody = zod.object({
  role: zod.enum(["admin", "super_admin"]).optional(),
  permissions: zod.array(zod.string()).optional(),
  isActive: zod.boolean().optional(),
});

export const UpdateAdminResponse = zod.object({
  id: zod.number(),
  userId: zod.number(),
  email: zod.string(),
  username: zod.string(),
  role: zod.enum(["admin", "super_admin"]),
  permissions: zod.array(zod.string()),
  isActive: zod.boolean(),
  createdAt: zod.coerce.date(),
});

/**
 * @summary Remove admin (super admin)
 */
export const DeleteAdminParams = zod.object({
  adminId: zod.coerce.number(),
});

export const DeleteAdminResponse = zod.object({
  message: zod.string(),
});

/**
 * @summary Get dashboard statistics for current user
 */
export const GetDashboardStatsResponse = zod.object({
  balance: zod.string(),
  totalEarned: zod.string(),
  totalWithdrawn: zod.string(),
  pendingWithdrawals: zod.string(),
  completedOffers: zod.number(),
  recentEarnings: zod.string(),
});

/**
 * @summary Get platform-wide stats (admin)
 */
export const GetAdminStatsResponse = zod.object({
  totalUsers: zod.number(),
  activeUsers: zod.number(),
  totalPlatforms: zod.number(),
  pendingWithdrawals: zod.number(),
  totalWithdrawnAllTime: zod.string(),
  totalBalanceInSystem: zod.string(),
  newUsersToday: zod.number(),
  withdrawalsToday: zod.number(),
});

/**
 * @summary Get recent activity for current user
 */
export const GetRecentActivityResponse = zod.object({
  activities: zod.array(
    zod.object({
      id: zod.number(),
      type: zod.string(),
      description: zod.string(),
      amount: zod.string().nullish(),
      createdAt: zod.coerce.date(),
    }),
  ),
});

/**
 * @summary Update own profile
 */
export const updateProfileBodyUsernameMin = 3;
export const updateProfileBodyUsernameMax = 30;

export const UpdateProfileBody = zod.object({
  username: zod
    .string()
    .min(updateProfileBodyUsernameMin)
    .max(updateProfileBodyUsernameMax)
    .optional(),
});

export const UpdateProfileResponse = zod.object({
  id: zod.number(),
  email: zod.string(),
  username: zod.string(),
  isAdmin: zod.boolean(),
  isSuperAdmin: zod.boolean(),
  status: zod.enum(["active", "disabled", "unverified"]),
  createdAt: zod.coerce.date(),
});

/**
 * @summary Change own password
 */
export const changePasswordBodyNewPasswordMin = 8;

export const ChangePasswordBody = zod.object({
  currentPassword: zod.string(),
  newPassword: zod.string().min(changePasswordBodyNewPasswordMin),
});

export const ChangePasswordResponse = zod.object({
  message: zod.string(),
});
