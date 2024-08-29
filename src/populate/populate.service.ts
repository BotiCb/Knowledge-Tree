import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as FormData from 'form-data';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserModel } from 'src/shared/schemas/user.schema';
import { DateStatistics } from 'src/shared/utils/types';
import { CourseModel } from 'src/shared/schemas/course.schema';
import { CourseDto } from 'src/courses/dto/output/course.dto';
import { Injectable } from '@nestjs/common';


@Injectable()
export class PopulateService {
  @InjectModel(UserModel.name) public readonly userModel: Model<UserModel>;
  @InjectModel(CourseModel.name) public readonly courseModel: Model<CourseModel>;
 testUsersPath = 'C:/Kadeno Internship/knowledge-tree/api/src/populate/test-contents/testUser.json';
 testCoursesPath = 'C:/Kadeno Internship/knowledge-tree/api/src/populate/test-contents/testCourses.json';
 videoFolderPath = 'C:/Kadeno Internship/knowledge-tree/api/src/populate/test-contents/coursevideos';
  async populateCourses(adminToken: string) {
    const testUsers = require(this.testUsersPath);
    const testCourses = require(this.testCoursesPath);
    const videoFolder = this.videoFolderPath;
    let testcourseIndex = 0; // This will keep track of the courses globally.
    let sectionVideoIndex = 0;

    try {
      const teachersResponse = await axios.get('http://localhost:3000/users?role=teacher', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const teachers = teachersResponse.data;

      const normalizedTestUsers = testUsers.map((user) => ({
        ...user,
        email: user.email.toLowerCase(),
      }));
      const normalizedTeachers = teachers.map((teacher) => ({
        ...teacher,
        email: teacher.email.toLowerCase(),
      }));

      const teacherLoginPromises = normalizedTeachers.map(async (teacher) => {
        const user = normalizedTestUsers.find((user) => user.email === teacher.email);

        if (user) {
          const teacherResponse = await axios.post('http://localhost:3000/auth/login', {
            email: teacher.email,
            password: user.password,
          });
          const teacherJwt = teacherResponse.data.access_token;
          const coursecount = Math.floor(Math.random() * 5) + 1;
          for (let i = 0; i < coursecount && testcourseIndex < testCourses.length; i++) {
            let localCourseIndex;

            // Synchronize access to testcourseIndex
            if (testcourseIndex < testCourses.length) {
              localCourseIndex = testcourseIndex++;
            } else {
              return; // Exit if no more courses are available
            }

            let courseCreated = false;
            let courseIdResponse;

            try {
              courseIdResponse = await axios.post(
                'http://localhost:3000/courses/create',
                {
                  courseName: testCourses[localCourseIndex].courseName,
                  description: testCourses[localCourseIndex].description,
                  courseType: testCourses[localCourseIndex].courseType,
                  difficulty: testCourses[localCourseIndex].difficulty,
                  price: testCourses[localCourseIndex].price.toString(),
                },
                {
                  headers: {
                    Authorization: `Bearer ${teacherJwt}`,
                  },
                }
              );

              courseCreated = courseIdResponse.status < 300;
            } catch (e) {
              console.error(`Error creating course: ${e.response?.status || e.message}`);
            }

            if (!courseCreated) {
              continue; // Skip to the next course if creation fails
            }

            const courseId = courseIdResponse.data;

            for (const article of testCourses[localCourseIndex].articles) {
              let articleIdResponse;
              try {
                articleIdResponse = await axios.post(
                  `http://localhost:3000/courses/${courseId}/articles/create`,
                  {
                    articleName: article.articleName,
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${teacherJwt}`,
                    },
                  }
                );
              } catch (e) {
                console.error(`Error creating article: ${e.response?.status || e.message}`);
                continue;
              }

              const articleId = articleIdResponse.data;

              for (const section of article.sections) {
                try {
                  const formData = new FormData();
                  const files = fs.readdirSync(videoFolder);
                  const fileName = files[sectionVideoIndex % files.length];
                  sectionVideoIndex++;

                  if (!fileName) {
                    console.error(`No file found for section: ${section.title}`);
                    continue;
                  }

                  const filePath = path.join(videoFolder, fileName);
                  formData.append('file', fs.createReadStream(filePath));
                  formData.append('title', section.title);

                  await axios.post(
                    `http://localhost:3000/courses/${courseId}/articles/${articleId}/sections/create`,
                    formData,
                    {
                      headers: {
                        ...formData.getHeaders(),
                        Authorization: `Bearer ${teacherJwt}`,
                      },
                    }
                  );
                } catch (e) {
                  console.error(`Error creating section: ${e.response?.status || e.message}`);
                  continue;
                }
              }
            }
            if (testcourseIndex % 4 == 0) {
              await axios.put(
                `http://localhost:3000/courses/${courseId}/make-pending`,
                {},
                {
                  headers: {
                    Authorization: `Bearer ${adminToken}`,
                  },
                }
              );
            } else {
              if (testcourseIndex % 4 > 1) {
                await axios.put(
                  `http://localhost:3000/courses/${courseId}/make-public`,
                  {},
                  {
                    headers: {
                      Authorization: `Bearer ${adminToken}`,
                    },
                  }
                );
              }
            }
          }
        } else {
          console.error(`No password found for teacher with email: ${teacher.email}`);
        }
      });

      await Promise.all(teacherLoginPromises);
    } catch (e) {
      console.error('An error occurred:', e.response?.data || e.message);
    }
  }

  private getRandomDate(pastDate: Date): Date {
    const now = new Date();
    if (pastDate >= now) {
      throw new Error('The past date must be before the current date.');
    }

    const pastTimestamp = pastDate.getTime();
    const nowTimestamp = now.getTime();
    const randomTimestamp = Math.floor(Math.random() * (nowTimestamp - pastTimestamp)) + pastTimestamp;
    return new Date(randomTimestamp);
  }

  async randomizeUserCreatedAtDate() {
    const users = await this.userModel.find().exec();
    const date = new Date();
    for (const user of users) {
      user.createdAt = this.getRandomDate(new Date(date.getFullYear(), date.getMonth() - 4, date.getDate()));
      for (let i = 0; i < 15; i++) {
        DateStatistics.registerAction(user.lastAction, true, true, this.getRandomDate(user.createdAt));
      }
      await user.save();
    }
  }

  async populateUsers(adminToken: string) {
    const testUsers = require(this.testUsersPath);
    let userIndex = 0;
    for (const user of testUsers) {
      const registerResponse = await axios.post('http://localhost:3000/auth/register', {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: user.password,
      });
      if (user.bio) {
        await axios.put(
          'http://localhost:3000/users',
          {
            bio: user.bio,
          },
          {
            headers: {
              Authorization: `Bearer ${registerResponse.data.access_token}`,
            },
          }
        );
      }
      console.log(registerResponse.data.access_token);
      const date = new Date();
      const userM = await this.userModel.findOne({ email: user.email });
      user.createdAt = this.getRandomDate(new Date(date.getFullYear(), date.getMonth() - 4, date.getDate()));
      const dateToRgister = Math.floor(Math.random() * 15) + 3;
      for (let i = 0; i < dateToRgister; i++) {
        DateStatistics.registerAction(userM.lastAction, true, true, this.getRandomDate(userM.createdAt));
      }

      await userM.save();
      if (userIndex % 10 == 0) {
        await axios.put(
          'http://localhost:3000/users/request-role/teacher',
          {},
          {
            headers: {
              Authorization: `Bearer ${registerResponse.data.access_token}`,
            },
          }
        );

        await axios.put(
          `http://localhost:3000/users/${userM._id}/approve-role`,
          {},
          {
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          }
        );
      }
      if (registerResponse.status < 300) {
        console.log(`Created user: ${user.email}`);
      } else {
        console.log(`Failed to create user: ${user.email}`);
      }

      userIndex++;
    }
  }

  async enrollCourses(adminToken: string) {
    const testUsers = require(this.testUsersPath);
    const studentResponse = await axios.get('http://localhost:3000/users?role=student', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const students = studentResponse.data;

    const normalizedTestUsers = testUsers.map((user) => ({
      ...user,
      email: user.email.toLowerCase(),
    }));
    const normalizedStudents = students.map((student) => ({
      ...student,
      email: student.email.toLowerCase(),
    }));
    const courses = await this.courseModel.find().exec();
    const studentLoginPromises = normalizedStudents.map(async (student) => {
      const user = normalizedTestUsers.find((user) => user.email === student.email);
      if (user) {
        const studentJwtResponse = await axios.post('http://localhost:3000/auth/login', {
          email: user.email,
          password: user.password,
        });

        const studentJwt = studentJwtResponse.data.access_token;
        console.log(studentJwt);
        const courseToEnroll = Math.floor(Math.random() * 7) + 2;
        console.log(`Enrolling ${courseToEnroll} courses for user: ${user.email}`);
        const enrolled: { courseId: string; createdAt: Date }[] = [];
        for (let i = 0; i < courseToEnroll; i++) {
          try {
            const courseIndex = Math.floor(Math.random() * courses.length);
            const courseId = courses[courseIndex]._id;
            await axios.put(
              `http://localhost:3000/users/enroll-course/${courseId.toString()}`,
              {},
              {
                headers: {
                  Authorization: `Bearer ${studentJwt}`,
                },
              }
            );
            enrolled.push({ courseId: courseId.toString(), createdAt: courses[courseIndex].createdAt });
          } catch (e) {
            console.error(`Error while enrolling student: ${e}`);
          }
        }
        const userM: UserModel = await this.userModel.findOne({ email: user.email }).exec();

        // Loop through enrolled courses and update the enrolledAt date
        userM.enrolledCourses.forEach((course) => {
          const enrollment = enrolled.find((enrolledCourse) => enrolledCourse.courseId === course.courseId.toString());
          if (enrollment) {
            course.enrolledAt = this.getRandomDate(
              enrollment.createdAt > userM.createdAt ? enrollment.createdAt : userM.createdAt
            );
          }
        });

        // Save the updated user document
        await userM.save();
      }
    });
    await Promise.all(studentLoginPromises);
  }

  async randomizeCourseDates() {
    const courses = await this.courseModel.find().exec();
    const date = new Date();
    for (const course of courses) {
      course.createdAt = this.getRandomDate(new Date(date.getFullYear(), date.getMonth() - 4, date.getDate()));
      const viewsToRgister = Math.floor(Math.random() * 1500) + 30;
      for (let i = 0; i < viewsToRgister; i++) {
        DateStatistics.registerAction(course.views, false, false, this.getRandomDate(course.createdAt));
      }
      await course.save();
    }
  }

  async populateProgress(adminToken: string) {
    const testUsers = require(this.testUsersPath);
    const normalizedTestUsers = testUsers.map((user) => ({
      ...user,
      email: user.email.toLowerCase(),
    }));

    const studentResponse = await axios.get('http://localhost:3000/users?role=student', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    const students = studentResponse.data;

    const normalizedStudents = students.map((student) => ({
      ...student,
      email: student.email.toLowerCase(),
    }));

    for (const student of normalizedStudents) {
      const user = normalizedTestUsers.find((user) => user.email === student.email);
      if (user) {
        try {
          const studentJwtResponse = await axios.post('http://localhost:3000/auth/login', {
            email: user.email,
            password: user.password,
          });
          const studentJwt = studentJwtResponse.data.access_token;

          const enrolledCoursesResponse = await axios.get('http://localhost:3000/courses?enrolled=true');
          const enrolledCourses = enrolledCoursesResponse.data;

          for (const enrolledCourse of enrolledCourses) {
            try {
              const courseResponse = await axios.get(`http://localhost:3000/courses/${enrolledCourse.courseId}`, {
                headers: {
                  Authorization: `Bearer ${studentJwt}`,
                },
              });

              const course: CourseDto = courseResponse.data;
              let toWatchFromCourse = Math.floor(Math.random() * course.duration);
              for (const article of course.articles) {
                for (const section of article.sections) {
                  if (toWatchFromCourse <= 0) {
                    break;
                  }
                  let progressResponse;
                  try {
                    const randSecs = Math.floor(
                      (Math.random() * section.videoDuration) / 2 + section.videoDuration / 2
                    );
                    const watchedSecs = randSecs < toWatchFromCourse ? randSecs : toWatchFromCourse;
                    toWatchFromCourse -= watchedSecs;
                    progressResponse = await axios.put(
                      `http://localhost:3000/courses/${course.courseId}/articles/${article.articleId}/sections/${section._id.toString()}/progress/${watchedSecs}`,
                      {},
                      {
                        headers: {
                          Authorization: `Bearer ${studentJwt}`,
                        },
                      }
                    );
                    console.log('Progress registered:', progressResponse.data);
                  } catch (e) {
                    console.log('Error registering progress');
                  }
                }
              }
            } catch (e) {
              console.log(`Error getting course: ${e}`);
            }
          }
        } catch (e) {
          console.log('Error during student login or course retrieval:', e.message);
        }
      }
    }
  }
}
