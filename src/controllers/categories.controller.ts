import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { Category } from '@interfaces/categories.interface';
import { CategoryService } from '@services/categories.service';

export class CategoryController {
  public category = Container.get(CategoryService);

  public getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const findAllCategories: Category[] = await this.category.findAllCategories();

      res.status(200).json({ data: findAllCategories, message: 'findAll' });
    } catch (error) {
      next(error);
    }
  };

  public getCategoryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categoryId = Number(req.params.id);
      const findOneCategory: Category = await this.category.findCategoryById(categoryId);

      res.status(200).json({ data: findOneCategory, message: 'findOne' });
    } catch (error) {
      next(error);
    }
  };

  public createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categoryData: Category = req.body;
      const createCategoryData: Category = await this.category.createCategory(categoryData);

      res.status(201).json({ data: createCategoryData, message: 'created' });
    } catch (error) {
      next(error);
    }
  };

  public updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categoryId = Number(req.params.id);
      const categoryData: Category = req.body;
      const updateCategoryData: Category = await this.category.updateCategory(categoryId, categoryData);

      res.status(200).json({ data: updateCategoryData, message: 'updated' });
    } catch (error) {
      next(error);
    }
  };

  public deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categoryId = Number(req.params.id);
      const deleteCategoryData: Category = await this.category.deleteCategory(categoryId);

      res.status(200).json({ data: deleteCategoryData, message: 'deleted' });
    } catch (error) {
      next(error);
    }
  };
}
