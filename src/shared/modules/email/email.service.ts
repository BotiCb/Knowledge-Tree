import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { config } from 'src/shared/config/config';
import { CourseModel } from 'src/shared/schemas/course.schema';
import { UserModel } from 'src/shared/schemas/user.schema';

@Injectable()
export class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      // host: config.get('email.smtpHost'),
      // port: 587,
      // secure: false, // use false for STARTTLS; true for SSL on port 465
      service: 'gmail',
      auth: {
        user: config.get('email.smtpUser'),
        pass: config.get('email.smtpPass'),
      },
    });
  }

  private async sendMail(to: string, subject: string, text: string, html: string): Promise<void> {
    const mailOptions = {
      from: config.get('email.fromEmail'),
      to,
      subject,
      text,
      html,
    };
    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.log(error);
    }
  }

  async succesfullRegistration(user: UserModel) {
    const { email, firstName, lastName } = user;
    const subject = 'Registration Successful';
    const text = `Dear ${firstName} ${lastName},\n\nYour registration was successful. You can now log in to your account using your email and password.\n\nThank you for using our service.`;
    const html = `<h1 color="blue">Dear ${firstName} ${lastName},</h1><br><br>Your registration was successful. You can now log in to your account using your email and password.<br><br>Thank you for using our service.`;
    await this.sendMail(email, subject, text, html);
  }

  async succesfullEnrollment(user: UserModel, course: CourseModel) {
    const { email, firstName, lastName } = user;
    const subject = 'Enrollment Successful';
    const text = `Dear ${firstName} ${lastName},\n\nYour enrollment in ${course.courseName} was successful. You can now start learning. \n\nThank you for using our service.`;
    const html = `<h1 color="blue">Dear ${firstName} ${lastName},</h1><br><br>Your enrollment in ${course.courseName} was successful. You can now start learning. <br><br>Thank you for using our service.`;
    await this.sendMail(email, subject, text, html);
  }

  async coursePublished(course: CourseModel) {
    const { author } = course;
    const { email, firstName, lastName } = author;
    const subject = 'Course Published';
    const text = `Dear ${firstName} ${lastName},\n\nYour course ${course.courseName} was published. \n\nThank you for using our service.`;
    const html = `<h1 color="blue">Dear ${firstName} ${lastName},</h1><br><br>Your course ${course.courseName} was published. <br><br>Thank you for using our service.`;
    await this.sendMail(email, subject, text, html);
  }

  async roleApproved(user: UserModel) {
    const { email, firstName, lastName, role } = user;
    const subject = 'Role Approved';
    const text = `Dear ${firstName} ${lastName},\n\nYour role ${role} was approved. \n\nThank you for using our service.`;
    const html = `<h1 color="blue">Dear ${firstName} ${lastName},</h1><br><br>Your role ${role} was approved. <br><br>Thank you for using our service.`;
    await this.sendMail(email, subject, text, html);
  }

  async roleRefused(user: UserModel) {
    const { email, firstName, lastName, pendingRole } = user;
    const subject = 'Role Refused';
    const text = `Dear ${firstName} ${lastName},\n\nYour role ${pendingRole} was refused. \n\nThank you for using our service.`;
    const html = `<h1 color="blue">Dear ${firstName} ${lastName},</h1><br><br>Your  ${pendingRole} role request was refused. <br><br>Thank you for using our service.`;
    await this.sendMail(email, subject, text, html);
  }

  async userDeleted(user: UserModel) {
    const { email, firstName, lastName } = user;
    const subject = 'Account Deleted';
    const text = `Dear ${firstName} ${lastName},\n\nYour account was deleted. \n\nThank you for using our service.`;
    const html = `<h1 color="blue">Dear ${firstName} ${lastName},</h1><br><br>Your account was deleted. <br><br>Thank you for using our service.`;
    await this.sendMail(email, subject, text, html);
  }
}
