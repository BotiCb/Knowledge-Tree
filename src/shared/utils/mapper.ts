import { HttpException } from '@nestjs/common';
import { CourseDifficulty, CourseTypes, Role } from './types';

export const stringToRole = (role: string): Role => {
  switch (role) {
    case 'admin':
      return Role.ADMIN;
    case 'student':
      return Role.STUDENT;
    case 'teacher':
      return Role.TEACHER;
    default:
      throw new HttpException('Invalid role', 400);
  }
};

export const stringToCourseDifficulty = (difficulty: string): CourseDifficulty => {
  switch (difficulty) {
    case 'Beginner':
      return CourseDifficulty.BEGINNER;
    case 'Intermediate':
      return CourseDifficulty.INTERMEDIATE;
    case 'Advanced':
      return CourseDifficulty.ADVANCED;
    case 'Professional':
      return CourseDifficulty.PROFESSIONAL;
    default:
      throw new HttpException('Invalid difficulty', 400);
  }
};

export const stringToCourseType = (type: string): CourseTypes => {
  switch (type) {
    case 'Language':
      return CourseTypes.LANGAUGE;
    case 'Programming':
      return CourseTypes.PROGRAMMING;
    case 'Math':
      return CourseTypes.MATH;
    case 'Engineering':
      return CourseTypes.ENGINEERING;
    case 'Physics':
      return CourseTypes.PHYSICS;
    case 'Chemistry':
      return CourseTypes.CHEMISTRY;
    case 'Biology':
      return CourseTypes.BIOLOGY;
    case 'Music':
      return CourseTypes.MUSIC;
    case 'Photography':
      return CourseTypes.PHOTOGRAPHY;
    case 'Art':
      return CourseTypes.ART;
    case 'IT & Software':
      return CourseTypes.IT_SOFTWARE;
    case 'Business':
      return CourseTypes.BUSINESS;
    case 'Design':
      return CourseTypes.DESIGN;
    case 'Lifestyle':
      return CourseTypes.LIFESTYLE;
    case 'Travel':
      return CourseTypes.TRAVEL;
    case 'Health':
      return CourseTypes.HEALTH;
    case 'History':
      return CourseTypes.HISTORY;
    case 'Geography':
      return CourseTypes.GEOGRAPHY;
    case 'Economy':
      return CourseTypes.ECONOMY;
    case 'Literature':
      return CourseTypes.LITERATURE;
    case 'Fitness':
      return CourseTypes.FITNESS;
    case 'Other':
      return CourseTypes.OTHER;
    default:
      throw new HttpException('Invalid Course type', 400);
  }
};

export const extractCourseObjectIdFromUrl = (url: string): string | null => {
  // Define a regular expression pattern to capture the Object ID from the URL
  const pattern = /\/(?:courses|wishlist)\/([a-fA-F0-9]{24})(?:\/|$)/;

  const match = url.match(pattern);

  // Return the Object ID if matched, otherwise return null
  return match ? match[1] : null;
};

export const isObjectId = (id: string): boolean => {
  return /^[a-fA-F0-9]{24}$/.test(id);
};
