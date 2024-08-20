export const AUTH_STATE_KEY = "wallet_auth_state";
export const FIVE_MINUTES = 5 * 60 * 1000;

export interface AuthState {
  emailAddress: string;
  password: string;
  expiration?: number;
}
