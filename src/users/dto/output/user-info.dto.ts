import { UserModel } from 'src/shared/schemas/user.schema';
import { Role } from 'src/shared/utils/types';

export class UserInfoDto {
  firstName: string;
  lastName: string;
  photoUrl: string;
  role: Role;
  email: string;
  userId: string;

  constructor(user: UserModel) {
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.photoUrl = user.photoUrl;
    this.role = user.role;
    this.email = user.email;
    this.userId = user._id.toString();
  }
}
