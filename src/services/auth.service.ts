import { PrismaClient } from '@prisma/client';
import { compare, hash } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { Service } from 'typedi';
import { SECRET_KEY } from '@config';
import { CreateUserDto, ForgetPasswordDto, ResetPasswordDto, ValidateAccountDto, LoginDoubleFaDto } from '@dtos/users.dto';
import { HttpException } from '@exceptions/httpException';
import { DataStoredInToken, TokenData } from '@interfaces/auth.interface';
import { User } from '@interfaces/users.interface';
import { v4 as uuid } from 'uuid';
import { sendMailForgetPassword, sendMailPasswordReset, sendMailCreateAccount } from '@mails/user/user.mail';
const speakeasy = require('speakeasy');

@Service()
export class AuthService {
  public users = new PrismaClient().user;

  public async signup(userData: CreateUserDto): Promise<User> {
    const findUser: User = await this.users.findUnique({ where: { email: userData.email } });
    if (findUser) throw new HttpException(409, `This email ${userData.email} already exists`);

    const validateAccountToken = uuid();
    const validateAccountTokenExpires = new Date(Date.now() + 3600000);

    const hashedPassword = await hash(userData.password, 10);
    const createUserData: Promise<User> = this.users.create({
      data: {
        ...userData,
        password: hashedPassword,
        validate_account_token: validateAccountToken,
        validate_account_expires: validateAccountTokenExpires,
      },
    });

    // Send email
    const link = `${process.env.FRONT_END}/validate-account/${validateAccountToken}`;
    await sendMailCreateAccount(userData.email, userData.first_name, userData.last_name, link, validateAccountTokenExpires);

    return { email: userData.email, first_name: userData.first_name, last_name: userData.last_name };
  }

  public async resendEmailValidation(userData: ForgetPasswordDto): Promise<User> {
    const findUser: User = await this.users.findUnique({ where: { email: userData.email } });
    if (!findUser) throw new HttpException(409, `This email ${userData.email} was not found`);

    if (findUser.validate) throw new HttpException(409, `This account is already validated`);

    const validateAccountToken = uuid();
    const validateAccountTokenExpires = new Date(Date.now() + 3600000);

    await this.users.update({
      where: { email: userData.email },
      data: { validate_account_token: validateAccountToken, validate_account_expires: validateAccountTokenExpires },
    });

    const link = `${process.env.FRONT_END}/validate-account/${validateAccountToken}`;
    await sendMailCreateAccount(findUser.email, findUser.first_name, findUser.last_name, link, validateAccountTokenExpires);
  }

  public async forgetPassword(userData: ForgetPasswordDto): Promise<User> {
    const findUser: User = await this.users.findUnique({ where: { email: userData.email } });
    if (!findUser) throw new HttpException(409, `This email ${userData.email} was not found`);

    const passwordToken = uuid();
    const passwordTokenExpires = new Date(Date.now() + 3600000);

    await this.users.update({
      where: { email: userData.email },
      data: { reset_password_token: passwordToken, reset_password_expires: passwordTokenExpires },
    });

    // Send email
    const link = `${process.env.FRONT_END}/reset-password/${passwordToken}`;

    await sendMailForgetPassword(userData.email, findUser.first_name, findUser.last_name, link, passwordTokenExpires);

    return findUser.email;
  }

  public async validateAccount(userData: ValidateAccountDto): Promise<string> {
    const findUser: User = await this.users.findUnique({ where: { validate_account_token: userData.token } });
    if (!findUser) throw new HttpException(400, `The link is expired`);

    const now = new Date();
    if (now > findUser.validate_account_expires) {
      throw new HttpException(400, `The link is expired`);
    }

    const updatedUserData = await this.users.update({
      where: { validate_account_token: userData.token },
      data: { validate: true, validate_account_token: '' },
    });

    return 'Account validated';
  }

  public async resetPassword(userData: ResetPasswordDto): Promise<User> {
    const findUser: User = await this.users.findUnique({ where: { reset_password_token: userData.token } });
    if (!findUser) throw new HttpException(400, `The link is expired`);

    const now = new Date();
    if (now > findUser.reset_password_expires) {
      throw new HttpException(400, `The link is expired`);
    }

    if (userData.password !== userData.confirm_password) {
      throw new HttpException(400, `Password and confirm password are not matching`);
    }

    const hashedPassword = await hash(userData.password, 10);
    const updatedUserData = await this.users.update({
      where: { reset_password_token: userData.token },
      data: { password: hashedPassword, reset_password_token: '' },
    });

    const link = `${process.env.FRONT_END}/login`;
    await sendMailPasswordReset(findUser.email, findUser.first_name, findUser.last_name, link);

    return updatedUserData;
  }

  public async login(userData: CreateUserDto): Promise<{ cookie: string; findUser: User }> {
    const findUser: User = await this.users.findUnique({ where: { email: userData.email } });
    if (!findUser) throw new HttpException(409, `This email ${userData.email} was not found`);

    if (!findUser.validate) throw new HttpException(403, `This account is not validated`);

    const isPasswordMatching: boolean = await compare(userData.password, findUser.password);
    if (!isPasswordMatching) throw new HttpException(409, 'Password is not matching');

    if (findUser.double_fa_activate && findUser.double_fa_first_verify) {
      if (findUser.double_fa_method == 'sms') {
        if (findUser.double_fa_sms_date > new Date()) {
          return { cookie: '', user: findUser.email, tokenData: 'faCheckSms' };
        }

        const dateNextSms = new Date(Date.now() + 120000);

        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const client = require('twilio')(accountSid, authToken);
        await client.verify.v2.services.create({ friendlyName: 'Kipdev' }).then(async service => {
          await this.users.update({
            where: { email: userData.email },
            data: { double_fa_sms_service: service.sid, double_fa_sms_date: dateNextSms },
          });

          await client.verify.v2
            .services(service.sid)
            .verifications.create({ to: findUser.phone_number, channel: 'sms' })
            .then(verification => console.log(verification.status));
        });

        return { cookie: '', user: findUser.email, tokenData: 'faCheckSms' };
      } else {
        return { cookie: '', user: findUser.email, tokenData: 'faCheckQrCode' };
      }
    }

    const tokenData = this.createToken(findUser);
    const cookie = this.createCookie(tokenData);

    return { cookie, findUser, tokenData };
  }

  public async loginDoubleFa(userData: LoginDoubleFaDto): Promise<{ cookie: string; findUser: User }> {
    const findUser: User = await this.users.findUnique({ where: { email: userData.email } });
    if (!findUser) throw new HttpException(409, `This email ${userData.email} was not found`);

    if (!findUser.validate) throw new HttpException(403, `This account is not validated`);

    if (userData.method == 'sms') {
      try {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const client = require('twilio')(accountSid, authToken);

        const verification_check = await client.verify.v2
          .services(findUser.double_fa_sms_service)
          .verificationChecks.create({ to: findUser.phone_number, code: userData.code });

        if (verification_check.status == 'approved') {
          const tokenData = this.createToken(findUser);
          const cookie = this.createCookie(tokenData);

          return { cookie, findUser, tokenData };
        } else {
          throw new HttpException(403, `The code is not correct`);
        }
      } catch (error) {
        throw new HttpException(403, `The code is not correct`);
      }
    } else {
      const verified = await speakeasy.totp.verify({
        secret: findUser.double_fa_token,
        encoding: 'base32',
        token: userData.code,
      });

      if (verified) {
        const tokenData = this.createToken(findUser);
        const cookie = this.createCookie(tokenData);

        return { cookie, findUser, tokenData };
      } else {
        throw new HttpException(403, `The code is not correct`);
      }
    }
  }

  public async logout(userData: User): Promise<User> {
    const findUser: User = await this.users.findFirst({ where: { email: userData.email, password: userData.password } });
    if (!findUser) throw new HttpException(409, "User doesn't exist");

    return findUser;
  }

  public createToken(user: User): TokenData {
    const dataStoredInToken: DataStoredInToken = { id: user.id };
    const secretKey: string = SECRET_KEY;
    const expiresIn: number = 60 * 60;

    return { expiresIn, token: sign(dataStoredInToken, secretKey, { expiresIn }) };
  }

  public createCookie(tokenData: TokenData): string {
    return `Authorization=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn};`;
  }
}
