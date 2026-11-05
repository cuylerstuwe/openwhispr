export const SIGN_IN_PROMPTED_AT_KEY = "signInPromptedAt";
// Legacy error actions open personal model settings instead of an account screen.
export function requestSignIn(): void {
  window.dispatchEvent(new CustomEvent("personal-open-model-settings"));
}
