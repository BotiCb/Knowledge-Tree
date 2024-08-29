import { CourseSummaryDto } from 'src/courses/dto/output/course-summary.dto';
import { UserModel } from 'src/shared/schemas/user.schema';
import { Role } from 'src/shared/utils/types';

export class DetailedUserProfileDto {
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
  lastLogin: Date;
  pendingRole: Role;

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
    this.enrolledCourses = enrolledCourses;
    this.createdCourses = createdCourses;
    this.wishlistedCourses = wishlistedCourses;
    this.createdAt = user.createdAt;
    this.role = user.role;
    this.email = user.email;
    this.lastLogin = user.lastLogin;
    this.pendingRole = user.pendingRole;
  }
}
