import { PrismaClient } from '@prisma/client';
import { compare, hash } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { Service } from 'typedi';
import { SECRET_KEY } from '@config';
import { CreateUserDto, ForgetPasswordDto, ResetPasswordDto } from '@dtos/users.dto';
import { HttpException } from '@exceptions/httpException';
import { DataStoredInToken, TokenData } from '@interfaces/auth.interface';
import { User } from '@interfaces/users.interface';
import { v4 as uuid } from 'uuid';
import { sendMailForgetPassword, sendMailPasswordReset } from '@mails/user/user.mail';
@Service()
export class AuthService {
  public users = new PrismaClient().user;

  public async signup(userData: CreateUserDto): Promise<User> {
    const findUser: User = await this.users.findUnique({ where: { email: userData.email } });
    if (findUser) throw new HttpException(409, `This email ${userData.email} already exists`);

    const hashedPassword = await hash(userData.password, 10);
    const createUserData: Promise<User> = this.users.create({ data: { ...userData, password: hashedPassword } });

    return createUserData;
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

    const isPasswordMatching: boolean = await compare(userData.password, findUser.password);
    if (!isPasswordMatching) throw new HttpException(409, 'Password is not matching');

    const tokenData = this.createToken(findUser);
    const cookie = this.createCookie(tokenData);

    return { cookie, findUser, tokenData };
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
