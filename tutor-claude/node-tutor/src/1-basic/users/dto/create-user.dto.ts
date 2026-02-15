export class CreateUserDto {
  email: string;
  name: string;
  role?: 'admin' | 'user' | 'guest';
}
