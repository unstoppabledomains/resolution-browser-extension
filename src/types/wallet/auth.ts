export const FIVE_MINUTES = 5 * 60 * 1000;

export interface AuthState {
  emailAddress: string;
  password: string;
  expiration?: number;
}
