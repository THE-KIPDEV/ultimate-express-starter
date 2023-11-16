import { Router } from 'express';
import { ArticleController } from '@controllers/articles.controller';
import { CreateArticleDto } from '@dtos/articles.dto';
import { Routes } from '@interfaces/routes.interface';
import { ValidationMiddleware } from '@middlewares/validation.middleware';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { MaybeAuthMiddleware } from '../middlewares/maybeAuth.middleware';
import { AdminMiddleware } from '../middlewares/admin.middleware';

export class ArticleRoute implements Routes {
  public path = '/articles';
  public router = Router();
  public article = new ArticleController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, this.article.getArticles);
    this.router.get(`${this.path}/admin-articles`, AdminMiddleware, this.article.getAdminArticles);
    this.router.get(`${this.path}/:slug`, MaybeAuthMiddleware, this.article.getArticleBySlug);
    this.router.post(`${this.path}`, AdminMiddleware, ValidationMiddleware(CreateArticleDto), this.article.createArticle);
    this.router.put(`${this.path}/:id(\\d+)`, AdminMiddleware, ValidationMiddleware(CreateArticleDto, true), this.article.updateArticle);
    this.router.delete(`${this.path}/:id(\\d+)`, AdminMiddleware, this.article.deleteArticle);
  }
}
