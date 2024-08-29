import { Role } from 'src/shared/utils/types';
import { CourseSummaryDto } from 'src/courses/dto/output/course-summary.dto';
import { UserModel } from 'src/shared/schemas/user.schema';
export class UserProfileDto {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string;
  bio: string;
  role: Role;
  enrolledCourses: CourseSummaryDto[];
  createdCourses: CourseSummaryDto[];
  wishlistedCourses: CourseSummaryDto[];
  createdAt: Date;
  email: string;

  constructor(
    user: UserModel,
    enrolledCourses: CourseSummaryDto[] = [],
    createdCourses: CourseSummaryDto[] = [],
    wishlistedCourses: CourseSummaryDto[] = []
  ) {
    this.id = user._id.toString();
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.photoUrl = user.photoUrl;
    this.bio = user.bio;
    this.role = user.role;
    this.enrolledCourses = enrolledCourses;
    this.createdCourses = createdCourses;
    this.wishlistedCourses = wishlistedCourses;
    this.createdAt = user.createdAt;
    this.email = user.email;
  }
}
