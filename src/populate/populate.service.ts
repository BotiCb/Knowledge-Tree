import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as FormData from 'form-data';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserModel } from 'src/shared/schemas/user.schema';
import { CourseVisibilityStatus, DateStatistics } from 'src/shared/utils/types';
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
  const testUsers = require('C:/Kadeno Internship/knowledge-tree/api/src/populate/test-contents/testUser.json');
  const testCourses = require('C:/Kadeno Internship/knowledge-tree/api/src/populate/test-contents/testCourses.json');
  const videoFolder = 'C:/Kadeno Internship/knowledge-tree/api/src/populate/test-contents/coursevideos';
  let testcourseIndex = 0;
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
            return;
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
            continue;
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

            // Create sections sequentially
            for (const section of article.sections) {
              await this.createSectionWithRetry(courseId, articleId, section, videoFolder, sectionVideoIndex, teacherJwt);
              sectionVideoIndex++;
            }

            // Refresh the course document to avoid version conflict
            await this.refreshCourseDocument(courseId, teacherJwt);
          }

          // Set course status after creating all sections
          try {
            if (localCourseIndex % 4 === 0) {
              await axios.put(
                `http://localhost:3000/courses/${courseId}/make-pending`,
                {},
                {
                  headers: {
                    Authorization: `Bearer ${adminToken}`,
                  },
                }
              );
            } else if (localCourseIndex % 4 > 1) {
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
          } catch (e) {
            console.error(`Error setting course status: ${e.response?.status || e.message}`);
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

// Helper function to create a section with retry mechanism
async  createSectionWithRetry(courseId, articleId, section, videoFolder, sectionVideoIndex, teacherJwt) {
  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const formData = new FormData();
      const files = fs.readdirSync(videoFolder);
      const fileName = files[sectionVideoIndex % files.length];

      if (!fileName) {
        console.error(`No file found for section: ${section.title}`);
        return;
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
      break; // Exit loop if successful
    } catch (e) {
      if (attempt < maxRetries - 1) {
        console.warn(`Retrying section creation for ${section.title} (Attempt ${attempt + 2})`);
      } else {
        console.error(`Error creating section after ${maxRetries} attempts: ${e.response?.status || e.message}`);
      }
    }
  }
}

// Helper function to refresh the course document to avoid version conflicts
async refreshCourseDocument(courseId, teacherJwt) {
  try {
    await axios.get(`http://localhost:3000/courses/${courseId}`, {
      headers: {
        Authorization: `Bearer ${teacherJwt}`,
      },
    });
  } catch (e) {
    console.error(`Error refreshing course document: ${e.response?.status || e.message}`);
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
    const testUsers= require('C:/Kadeno Internship/knowledge-tree/api/src/populate/test-contents/testUser.json');
    const date = new Date();
    for (const user of users) {
      user.createdAt = this.getRandomDate(new Date(date.getFullYear(), date.getMonth() - 4, date.getDate()));
      for (let i = 0; i < 15; i++) {
        DateStatistics.registerAction(user.lastAction, true, true, this.getRandomDate(user.createdAt));
        user.photoUrl = testUsers.find((u) => u.email === user.email)?.photoUrl;
      }
      await user.save();
    }
  }

  async populateUsers(adminToken: string) {
    try{
    const testUsers = require('C:/Kadeno Internship/knowledge-tree/api/src/populate/test-contents/testUser.json');
    let userIndex = 0;
    for (const user of testUsers) {
      const registerResponse = await axios.post('http://localhost:3000/auth/register', {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: user.password,
      });
      if (user.description) {
        await axios.put(
          'http://localhost:3000/users',
          {
            bio: user.description,
          },
          {
            headers: {
              Authorization: `Bearer ${registerResponse.data.access_token}`,
            },
          }
        );
      }
      
      
      const userM = await this.userModel.findOne({ email: user.email });
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
    }}
    catch(e){
      console.log(e);
    }
  }

  async enrollCourses(adminToken: string) {
    try {
      const testUsers = require('C:/Kadeno Internship/knowledge-tree/api/src/populate/test-contents/testUser.json');
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
  
      const courses = await this.courseModel.find({ visibility: CourseVisibilityStatus.PUBLIC }).exec();
  
      // Limit the number of concurrent logins/enrollments
      const concurrencyLimit = 5;
      let index = 0;
  
      const studentLoginPromises = async () => {
        while (index < normalizedStudents.length) {
          const student = normalizedStudents[index++];
          const user = normalizedTestUsers.find((user) => user.email === student.email);
  
          if (user) {
            try {
              const studentJwtResponse = await axios.post('http://localhost:3000/auth/login', {
                email: user.email,
                password: user.password,
              });
  
              const studentJwt = studentJwtResponse.data.access_token;
              const courseToEnroll = Math.floor(Math.random() * 7) + 2;
              console.log(`Enrolling ${courseToEnroll} courses for user: ${user.email}`);
  
              const enrolled: { courseId: string; createdAt: Date }[] = [];
              const uniqueCourses = new Set();
  
              for (let i = 0; i < courseToEnroll; i++) {
                try {
                  let courseIndex;
                  let courseId;
  
                  // Ensure a unique course is selected
                  do {
                    courseIndex = Math.floor(Math.random() * courses.length);
                    courseId = courses[courseIndex]._id.toString();
                  } while (uniqueCourses.has(courseId) && uniqueCourses.size < courses.length);
  
                  if (!uniqueCourses.has(courseId)) {
                    uniqueCourses.add(courseId);
                    await axios.put(
                      `http://localhost:3000/users/enroll-course/${courseId}`,
                      {},
                      {
                        headers: {
                          Authorization: `Bearer ${studentJwt}`,
                        },
                      }
                    );
                    enrolled.push({ courseId, createdAt: courses[courseIndex].createdAt });
                  }
                } catch (e) {
                  console.error(`Error while enrolling student ${user.email} in course: ${e.response?.data || e.message}`);
                }
              }
  
              const userM: UserModel = await this.userModel.findOne({ email: user.email }).exec();
  
              // Update enrolled courses' enrolledAt date
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
            } catch (e) {
              console.error(`Error processing student ${user.email}: ${e.response?.data || e.message}`);
            }
          }
        }
      };
  
      // Run enrollment process with limited concurrency
      const concurrencyArray = Array.from({ length: concurrencyLimit }, studentLoginPromises);
      await Promise.all(concurrencyArray);
    } catch (e) {
      console.error('An error occurred during course enrollment:', e.response?.data || e.message);
    }
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
    const testUsers = require('C:/Kadeno Internship/knowledge-tree/api/src/populate/test-contents/testUser.json');
    const normalizedTestUsers = testUsers.map((user) => ({
      ...user,
      email: user.email.toLowerCase(),
    }));
  
    try {
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
  
            const enrolledCoursesResponse = await axios.get('http://localhost:3000/courses?enrolled=true', {
              headers: {
                Authorization: `Bearer ${studentJwt}`,
              },
            });
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
                    try {
                      const randSecs = Math.floor((Math.random() * section.videoDuration) / 2 + section.videoDuration / 2);
                      const watchedSecs = Math.min(randSecs, toWatchFromCourse); // Prevent negative progress
                      toWatchFromCourse -= watchedSecs;
  
                      const progressResponse = await axios.put(
                        `http://localhost:3000/courses/${course.courseId}/articles/${article.articleId}/sections/${section._id.toString()}/progress/${watchedSecs}`,
                        {},
                        {
                          headers: {
                            Authorization: `Bearer ${studentJwt}`,
                          },
                        }
                      );
                      console.log('Progress registered:', user.email);
                    } catch (e) {
                      console.error(`Error registering progress for section ${section._id}:`, e.response?.data || e.message);
                    }
                  }
                }
              } catch (e) {
                console.error(`Error retrieving course ${enrolledCourse.courseId}:`, e.response?.data || e.message);
              }
            }
          } catch (e) {
            console.error(`Error during student login or course retrieval for ${student.email}:`, e.response?.data || e.message);
          }
        } else {
          console.error(`User with email ${student.email} not found in test users.`);
        }
      }
    } catch (e) {
      console.error('Error during the overall process:', e.response?.data || e.message);
    }
  }
}
