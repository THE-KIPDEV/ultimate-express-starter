import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { RequestWithUser } from '@interfaces/auth.interface';
import { User } from '@interfaces/users.interface';
import { AuthService } from '@services/auth.service';

export class AuthController {
  public auth = Container.get(AuthService);

  public signUp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: User = req.body;
      const signUpUserData: User = await this.auth.signup(userData);

      res.status(201).json({ data: signUpUserData, message: 'signup' });
    } catch (error) {
      next(error);
    }
  };

  public logInMagicLink = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: User = req.body;
      const loginMagicLinkData: User = await this.auth.logInMagicLink(userData);

      res.status(201).json({ data: loginMagicLinkData, message: 'logInMagicLink' });
    } catch (error) {
      next(error);
    }
  };

  public forgetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: User = req.body;
      const forgetPasswordData: User = await this.auth.forgetPassword(userData);

      res.status(201).json({ data: forgetPasswordData, message: 'forgetPassword' });
    } catch (error) {
      next(error);
    }
  };

  public magicLink = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: User = req.body;
      const magicLinkData: User = await this.auth.magicLink(userData);

      res.status(201).json({ data: magicLinkData, message: 'magicLink' });
    } catch (error) {
      next(error);
    }
  };

  public resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: User = req.body;
      const resetPasswordData: User = await this.auth.resetPassword(userData);

      res.status(201).json({ data: resetPasswordData, message: 'resetPassword' });
    } catch (error) {
      next(error);
    }
  };

  public validateAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: User = req.body;
      const validateAccountData: User = await this.auth.validateAccount(userData);

      res.status(201).json({ data: validateAccountData, message: 'validateAccount' });
    } catch (error) {
      next(error);
    }
  };

  public resendEmailValidation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: User = req.body;
      const resendEmailValidationData: User = await this.auth.resendEmailValidation(userData);

      res.status(201).json({ data: resendEmailValidationData, message: 'resendEmailValidation' });
    } catch (error) {
      next(error);
    }
  };

  public logIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: User = req.body;
      const { cookie, findUser, tokenData } = await this.auth.login(userData);

      res.setHeader('Set-Cookie', [cookie]);
      res.status(200).json({ data: { user: findUser, token: tokenData }, message: 'login' });
    } catch (error) {
      next(error);
    }
  };

  public loginDoubleFa = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: User = req.body;
      const { cookie, findUser, tokenData } = await this.auth.loginDoubleFa(userData);

      res.setHeader('Set-Cookie', [cookie]);
      res.status(200).json({ data: { user: findUser, token: tokenData }, message: 'login' });
    } catch (error) {
      next(error);
    }
  };

  public logOut = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: User = req.user;
      const logOutUserData: User = await this.auth.logout(userData);

      res.setHeader('Set-Cookie', ['Authorization=; Max-age=0']);
      res.status(200).json({ data: logOutUserData, message: 'logout' });
    } catch (error) {
      next(error);
    }
  };
}
