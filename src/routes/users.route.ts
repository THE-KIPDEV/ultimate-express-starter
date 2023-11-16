import { Router } from 'express';
import { UserController } from '@controllers/users.controller';
import { CreateUserDto } from '@dtos/users.dto';
import { Routes } from '@interfaces/routes.interface';
import { ValidationMiddleware } from '@middlewares/validation.middleware';
import { AdminMiddleware } from '../middlewares/admin.middleware';
import { CreateAdminDto } from '../dtos/admin.dto';
import { ProtectedMiddelware } from '../middlewares/protected.middleware';

export class UserRoute implements Routes {
  public path = '/users';
  public router = Router();
  public user = new UserController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, AdminMiddleware, this.user.getUsers);
    this.router.post(`${this.path}/create-admin`, ProtectedMiddelware, ValidationMiddleware(CreateAdminDto), this.user.createAdmin);
    this.router.get(`${this.path}/:id(\\d+)`, AdminMiddleware, this.user.getUserById);
    this.router.post(`${this.path}`, AdminMiddleware, ValidationMiddleware(CreateUserDto), this.user.createUser);
    this.router.put(`${this.path}/:id(\\d+)`, AdminMiddleware, ValidationMiddleware(CreateUserDto, true), this.user.updateUser);
    this.router.delete(`${this.path}/:id(\\d+)`, AdminMiddleware, this.user.deleteUser);
  }
}
