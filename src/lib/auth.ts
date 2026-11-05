export const AUTH_URL = "";
export const ADMIN_URL = "";
export type SocialProvider = "google" | "microsoft" | "apple";
export interface AuthActionError extends Error {
  code?: string;
  status?: number;
}
const unavailable = async (..._args: unknown[]) => ({
  error: new Error("Accounts are not part of this personal build."),
});
// Compatibility for dormant account components. No client is constructed and no request is made.
export const authClient: any = {
  useSession: () => ({ data: null, isPending: false, error: null, refetch: async () => null }),
  getSession: async () => ({ data: null }),
  signOut: async () => ({}),
  signIn: { email: unavailable, social: unavailable, sso: unavailable },
  signUp: { email: unavailable },
  requestPasswordReset: unavailable,
  sendVerificationEmail: unavailable,
  changePassword: unavailable,
  updateUser: unavailable,
  deleteUser: unavailable,
};
export const signInWithSocial = unavailable;
export const signInWithSSO = unavailable;
export const requestPasswordReset = unavailable;
export const updateDisplayName = unavailable;
export const changePassword = unavailable;
export async function signOut() {}
export function updateLastSignInTime() {}
export function isWithinGracePeriod() {
  return false;
}
export function getGracePeriodRemainingMs() {
  return 0;
}
export async function withSessionRefresh<T>(operation: () => Promise<T>): Promise<T> {
  return operation();
}
export async function openAdminConsole() {}
export async function hasCredentialAccount() {
  return false;
}
