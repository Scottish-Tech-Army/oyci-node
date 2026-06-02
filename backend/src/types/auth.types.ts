export type Role = 'admin' | 'staff';

export interface AuthTokenPayload {
  sub: string;   // user_account id
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface RequestUser {
  id: string;
  email: string;
  role: Role;
}
