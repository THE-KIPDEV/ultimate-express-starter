import { Router } from 'express';
import { MediaController } from '@controllers/medias.controller';
import { CreateMediaDto } from '@dtos/medias.dto';
import { Routes } from '@interfaces/routes.interface';
import { ValidationMiddleware } from '@middlewares/validation.middleware';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { MaybeAuthMiddleware } from '../middlewares/maybeAuth.middleware';
import { AdminMiddleware } from '../middlewares/admin.middleware';
import multer from 'multer';

export class MediaRoute implements Routes {
  public path = '/media';
  public router = Router();
  public media = new MediaController();
  public storage = multer.memoryStorage();
  public upload = multer({ storage: this.storage });
  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, MaybeAuthMiddleware, this.media.getMedias);
    this.router.get(`${this.path}/:id`, MaybeAuthMiddleware, this.media.getMediaById);
    this.router.post(`${this.path}`, AuthMiddleware, ValidationMiddleware(CreateMediaDto), this.media.createMedia);
    this.router.post(`${this.path}/audio-video`, AuthMiddleware, this.upload.single('file'), this.media.createAudioVideoMedia);
    this.router.put(`${this.path}/:id(\\d+)`, AdminMiddleware, ValidationMiddleware(CreateMediaDto, true), this.media.updateMedia);
    this.router.delete(`${this.path}/:id(\\d+)`, AdminMiddleware, this.media.deleteMedia);
  }
}
