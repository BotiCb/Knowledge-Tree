import { applyDecorators, UseGuards } from '@nestjs/common';
import { TeacherRoleGuard } from '../guards/teacher-role-guard';
import { AdminRoleGuard } from '../guards/admin-role-guard';
import { JwtGuard } from '../guards/jwt-guard';
import { AuthorRoleGuard } from '../guards/author-role-guard';
import { EnrolledCourseGuard } from '../guards/enrolled-course-guard';
import { CourseVisibilityGuard } from '../guards/course-visibility-guard';
import { AlwaysAllowGuard } from '../guards/allways-allow-guard';

export const StudentRole = () => applyDecorators(UseGuards(JwtGuard));
export const TeacherRole = () => applyDecorators(UseGuards(JwtGuard, TeacherRoleGuard));
export const AdminRole = () => applyDecorators(UseGuards(JwtGuard, AdminRoleGuard));
export const UserRole = () => applyDecorators(UseGuards(JwtGuard));
export const AuthorRole = () => applyDecorators(UseGuards(JwtGuard, TeacherRoleGuard, AuthorRoleGuard));
export const AuthorOrEnrolledRole = () =>
  applyDecorators(UseGuards(JwtGuard, CourseVisibilityGuard, EnrolledCourseGuard));
export const CourseVisibilityRole = () => applyDecorators(UseGuards(AlwaysAllowGuard, CourseVisibilityGuard));
export const UserCourseVisibilityRole = () => applyDecorators(UseGuards(JwtGuard, CourseVisibilityGuard));
