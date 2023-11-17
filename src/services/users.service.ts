import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';
import { Service } from 'typedi';
import { CreateUserDto, LoginDoubleFaDto } from '@dtos/users.dto';
import { HttpException } from '@/exceptions/httpException';
import { User } from '@interfaces/users.interface';
import { CreateAdminDto } from '../dtos/admin.dto';
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
@Service()
export class UserService {
  public user = new PrismaClient().user;

  public async findAllUser(): Promise<User[]> {
    const allUser: User[] = await this.user.findMany();
    return allUser;
  }

  public async findUserById(userId: number): Promise<User> {
    const findUser: User = await this.user.findUnique({ where: { id: userId } });
    if (!findUser) throw new HttpException(409, "User doesn't exist");

    return findUser;
  }

  public async createUser(userData: CreateUserDto): Promise<User> {
    const findUser: User = await this.user.findUnique({ where: { email: userData.email } });
    if (findUser) throw new HttpException(409, `This email ${userData.email} already exists`);

    const hashedPassword = await hash(userData.password, 10);
    const createUserData: User = await this.user.create({ data: { ...userData, password: hashedPassword } });
    return createUserData;
  }

  public async createAdmin(userData: CreateAdminDto): Promise<User> {
    const findUser: User = await this.user.findUnique({ where: { id: userData.user_id } });
    if (!findUser) throw new HttpException(404, `This user ${userData.user_id} doesn't exist`);

    const updateUserData = await this.user.update({ where: { id: userData.user_id }, data: { role: 'admin' } });
    return updateUserData;
  }

  public async updateUser(userId: number, userData: CreateUserDto): Promise<User> {
    const findUser: User = await this.user.findUnique({ where: { id: userId } });
    if (!findUser) throw new HttpException(409, "User doesn't exist");

    const hashedPassword = await hash(userData.password, 10);
    const updateUserData = await this.user.update({ where: { id: userId }, data: { ...userData, password: hashedPassword } });
    return updateUserData;
  }

  public async updateProfil(userData: CreateUserDto, user: User): Promise<User> {
    // We need to check if user activate 2FA or change method
    let double_fa_first_verify = user.double_fa_first_verify;
    if (!double_fa_first_verify || (userData.double_fa_method !== user.double_fa_method && userData.double_fa_activate)) {
      double_fa_first_verify = false;

      if (userData.double_fa_activate && userData.double_fa_method === 'sms' && !userData.phone_number) {
        throw new HttpException(409, 'Phone number is required');
      } else if (userData.double_fa_activate && userData.double_fa_method === 'sms' && userData.phone_number) {
        const dateNextSms = new Date(Date.now() + 120000);

        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const client = require('twilio')(accountSid, authToken);
        await client.verify.v2.services.create({ friendlyName: 'Kipdev' }).then(async service => {
          console.log(service.sid);
          await this.user.update({
            where: { email: user.email },
            data: {
              ...userData,
              double_fa_sms_service: service.sid,
              double_fa_sms_date: dateNextSms,
              double_fa_first_verify: double_fa_first_verify,
            },
          });

          await client.verify.v2
            .services(service.sid)
            .verifications.create({ to: userData.phone_number, channel: 'sms' })
            .then(verification => console.log(verification.status));
        });
        const userUpdate = {
          email: user.email,
          qrCode: null,
        };
        return userUpdate;
      }

      if (userData.double_fa_activate && userData.double_fa_method === 'qrcode') {
        const secret = await speakeasy.generateSecret({ length: 20 });
        await this.user.update({
          where: { id: user.id },
          data: { ...userData, double_fa_token: secret.base32, double_fa_first_verify: double_fa_first_verify },
        });

        const userUpdate = {
          email: user.email,
          qrCode: await qrcode.toDataURL(secret.otpauth_url),
        };
        return userUpdate;
      }
    } else {
      await this.user.update({
        where: { id: user.id },
        data: { ...userData },
      });

      const userUpdate = {
        email: user.email,
        qrCode: null,
      };

      return userUpdate;
    }
  }

  public async firstDoubleFaValidate(userData: LoginDoubleFaDto, user: User): Promise<string> {
    if (userData.method == 'sms') {
      try {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const client = require('twilio')(accountSid, authToken);

        const verification_check = await client.verify.v2
          .services(user.double_fa_sms_service)
          .verificationChecks.create({ to: user.phone_number, code: userData.code });

        if (verification_check.status == 'approved') {
          await this.user.update({
            where: { id: user.id },
            data: { double_fa_first_verify: true },
          });

          return 'Ok';
        } else {
          throw new HttpException(403, `The code is not correct`);
        }
      } catch (error) {
        throw new HttpException(403, `The code is not correct`);
      }
    } else {
      const verified = await speakeasy.totp.verify({
        secret: user.double_fa_token,
        encoding: 'base32',
        token: userData.code,
      });

      if (verified) {
        await this.user.update({
          where: { id: user.id },
          data: { double_fa_first_verify: true },
        });

        return 'Ok';
      } else {
        throw new HttpException(403, `The code is not correct`);
      }
    }
  }

  public async deleteUser(userId: number): Promise<User> {
    const findUser: User = await this.user.findUnique({ where: { id: userId } });
    if (!findUser) throw new HttpException(409, "User doesn't exist");

    const deleteUserData = await this.user.delete({ where: { id: userId } });
    return deleteUserData;
  }
}
