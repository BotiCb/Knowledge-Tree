import { Role } from 'src/shared/utils/types';
import { CourseSummaryDto } from 'src/courses/dto/output/course-summary.dto';
import { UserModel } from 'src/shared/schemas/user.schema';
export class AuthorProfileDto {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string;
  bio: string;
  role: Role;
  createdCourses: CourseSummaryDto[];

  constructor(user: UserModel, createdCourses: CourseSummaryDto[] = []) {
    this.id = user._id.toString();
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.photoUrl = user.photoUrl;
    this.bio = user.bio;
    this.role = user.role;
    this.createdCourses = createdCourses;
  }
}
