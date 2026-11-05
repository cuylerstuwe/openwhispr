// Personal desktop builds have no company accounts, tokens, or session requests.
type PersonalUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  emailVerified?: boolean;
};
const state = {
  isSignedIn: false as boolean,
  isGracePeriodOnly: false,
  isLoaded: true,
  session: null,
  user: null as PersonalUser | null,
  isOfflineAccount: false,
  refetch: async () => ({ data: null, error: null }),
};
export function useAuth() {
  return state;
}
