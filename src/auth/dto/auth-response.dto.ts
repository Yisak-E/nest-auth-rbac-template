import { UserRole } from '../schemas/user.schema';

export class AuthResponseDto {
  access_token: string;
  user: {
    id: string;
    username: string;
    email: string;
    roles: UserRole[];
  };
}