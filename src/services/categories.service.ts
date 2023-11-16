import { PrismaClient } from '@prisma/client';
import { Service } from 'typedi';
import { CreateCategoryDto } from '@dtos/categories.dto';
import { HttpException } from '@/exceptions/httpException';
import { Category } from '@interfaces/categories.interface';

@Service()
export class CategoryService {
  public category = new PrismaClient().category;

  public async findAllCategories(): Promise<Category[]> {
    const allCategories: Category[] = await this.category.findMany();
    return allCategories;
  }

  public async findCategoryById(categoryId: number): Promise<Category> {
    const findCategory: Category = await this.category.findUnique({ where: { id: categoryId } });
    if (!findCategory) throw new HttpException(409, "Category doesn't exist");

    return findCategory;
  }

  public async createCategory(categoryData: CreateCategoryDto): Promise<Category> {
    const createCategoryData: Category = await this.category.create({ data: { ...categoryData } });
    return createCategoryData;
  }

  public async updateCategory(categoryId: number, categoryData: CreateCategoryDto): Promise<Category> {
    const findCategory: Category = await this.category.findUnique({ where: { id: categoryId } });
    if (!findCategory) throw new HttpException(409, "Category doesn't exist");

    const updateCategoryData = await this.category.update({ where: { id: categoryId }, data: { ...categoryData } });
    return updateCategoryData;
  }

  public async deleteCategory(categoryId: number): Promise<Category> {
    const findCategory: Category = await this.category.findUnique({ where: { id: categoryId } });
    if (!findCategory) throw new HttpException(409, "Category doesn't exist");

    const deleteCategoryData = await this.category.delete({ where: { id: categoryId } });
    return deleteCategoryData;
  }
}
