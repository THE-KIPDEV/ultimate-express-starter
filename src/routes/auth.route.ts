import { Router } from 'express';
import { AuthController } from '@controllers/auth.controller';
import { CreateUserDto, UpdateUserDto, ResetPasswordDto, ForgetPasswordDto, ValidateAccountDto, LoginDoubleFaDto } from '@dtos/users.dto';
import { Routes } from '@interfaces/routes.interface';
import { AuthMiddleware } from '@middlewares/auth.middleware';
import { ValidationMiddleware } from '@middlewares/validation.middleware';

export class AuthRoute implements Routes {
  public path = '/';
  public router = Router();
  public auth = new AuthController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}signup`, ValidationMiddleware(CreateUserDto), this.auth.signUp);
    this.router.post(`${this.path}login`, ValidationMiddleware(UpdateUserDto), this.auth.logIn);
    this.router.post(`${this.path}logout`, AuthMiddleware, this.auth.logOut);
    this.router.post(`${this.path}login-double-fa`, ValidationMiddleware(LoginDoubleFaDto), this.auth.loginDoubleFa);
    this.router.post(`${this.path}forget-password`, ValidationMiddleware(ForgetPasswordDto), this.auth.forgetPassword);
    this.router.post(`${this.path}resend-email-validation`, ValidationMiddleware(ForgetPasswordDto), this.auth.resendEmailValidation);
    this.router.post(`${this.path}reset-password`, ValidationMiddleware(ResetPasswordDto), this.auth.resetPassword);
    this.router.post(`${this.path}validate-account`, ValidationMiddleware(ValidateAccountDto), this.auth.validateAccount);
  }
}
