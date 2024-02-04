import { PrismaClient } from '@prisma/client';
import { Service } from 'typedi';
import { CreateArticleDto } from '@dtos/articles.dto';
import { HttpException } from '@/exceptions/httpException';
import { Article } from '@interfaces/articles.interface';
import { UserService } from './users.service';
import slugify from 'slugify';
import { Container } from 'typedi';
import { CategoryService } from './categories.service';
import { MediaService } from './medias.service';
import { User } from '@interfaces/users.interface';

@Service()
export class ArticleService {
  public category = Container.get(CategoryService);
  public user = Container.get(UserService);
  public media = Container.get(MediaService);
  public article = new PrismaClient().article;
  public categoryArticleLink = new PrismaClient().CategoryArticleLink;
  public mediaArticleLink = new PrismaClient().MediaArticleLink;

  public async formatArticle(article: Article): Promise<Article> {
    const user_id = article.user_id;
    const categories = await this.categoryArticleLink.findMany({ where: { article_id: article.id } });
    const medias = await this.mediaArticleLink.findMany({ where: { article_id: article.id } });
    const user = await this.user.findUserById(user_id);
    delete user.password;

    const mediasFinal = [];
    for (const media of medias) {
      const mediaData = await this.media.findMediaById(media.media_id);
      mediasFinal.push(mediaData);
    }

    const categoriesFinal = [];
    for (const category of categories) {
      const categoryData = await this.category.findCategoryById(category.category_id);
      categoriesFinal.push(categoryData);
    }

    const articleData = {
      ...article,
      user,
      categories: categoriesFinal,
      medias: mediasFinal,
    };

    return articleData;
  }

  public async findAllAdminArticles(search: string, page: number, itemPerPage: number, status: string): Promise<Article[]> {
    let skip = 0;
    if (page > 1) {
      skip = (page - 1) * itemPerPage;
    }

    const take = Number(itemPerPage);

    const allArticle: Article[] = await this.article.findMany({
      skip,
      take,
      where: {
        ...(status ? { status } : {}),
        title: {
          contains: search,
        },
      },
    });

    const nbArticleTotal = await this.article.count({
      where: {
        ...(status ? { status } : {}),
        title: {
          contains: search,
        },
      },
    });

    const articles = await Promise.all(allArticle.map(async article => await this.formatArticle(article)));

    return { nbArticleTotal, articles };
  }

  public async findAllArticles(search: string, page: number, itemPerPage: number): Promise<Article[]> {
    let skip = 0;
    if (page > 1) {
      skip = (page - 1) * itemPerPage;
    }

    const take = Number(itemPerPage);

    const allArticle: Article[] = await this.article.findMany({
      skip,
      take,
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        CategoryArticleLink: {
          include: {
            category: {
              select: {
                id: true,
                title: true,
                color: true,
              },
            },
          },
        },
        MediaArticleLink: {
          include: {
            media: {
              select: {
                id: true,
                url: true,
              },
            },
          },
        },
      },
      where: {
        status: 'published',
        title: {
          contains: search,
        },
      },
    });

    const nbArticleTotal = await this.article.count({
      where: {
        status: 'published',
        title: {
          contains: search,
        },
      },
    });

    return { nbArticleTotal, articles: allArticle };
  }

  public async findArticleBySlug(slug: string, user: User): Promise<Article> {
    const findArticle: Article = await this.article.findFirst({ where: { slug: slug, ...(!user ? { status: 'published' } : {}) } });
    if (!findArticle) throw new HttpException(409, "Article doesn't exist");

    return await this.formatArticle(findArticle);
  }

  public async findArticleById(articleId: number): Promise<Article> {
    const findArticle: Article = await this.article.findUnique({ where: { id: articleId } });
    if (!findArticle) throw new HttpException(409, "Article doesn't exist");

    return await this.formatArticle(findArticle);
  }

  public async createArticle(articleData: CreateArticleDto): Promise<Article> {
    const userExist = await this.user.findUserById(articleData.user_id);
    if (!userExist) throw new HttpException(404, "User doesn't exist");

    const slug = slugify(articleData.title, { lower: true, strict: true });

    const categories = articleData.categories;
    const medias = articleData.medias;
    for (const media of medias) {
      const mediaExist = await this.media.findMediaById(media);
      if (!mediaExist) throw new HttpException(404, "Media doesn't exist");
    }

    for (const category of categories) {
      const categoryExist = await this.category.findCategoryById(category);
      if (!categoryExist) throw new HttpException(404, "Category doesn't exist");
    }

    delete articleData.categories;
    delete articleData.medias;

    const createArticleData: Article = await this.article.create({ data: { ...articleData, slug } });

    categories.map(async category => {
      await this.categoryArticleLink.create({ data: { category_id: category, article_id: createArticleData.id } });
    });

    medias.map(async media => {
      await this.mediaArticleLink.create({ data: { media_id: media, article_id: createArticleData.id } });
    });

    return createArticleData;
  }

  public async updateArticle(articleId: number, articleData: CreateArticleDto): Promise<Article> {
    const findArticle: Article = await this.article.findUnique({ where: { id: articleId } });
    if (!findArticle) throw new HttpException(409, "Article doesn't exist");

    const userExist = await this.user.findUserById(articleData.user_id);
    if (!userExist) throw new HttpException(404, "User doesn't exist");

    const slug = slugify(articleData.title, { lower: true, strict: true });

    const categories = articleData.categories;
    const medias = articleData.medias;

    for (const media of medias) {
      const mediaExist = await this.media.findMediaById(media);
      if (!mediaExist) throw new HttpException(404, "Media doesn't exist");
    }

    for (const category of categories) {
      const categoryExist = await this.category.findCategoryById(category);
      if (!categoryExist) throw new HttpException(404, "Category doesn't exist");
    }

    delete articleData.categories;
    delete articleData.medias;

    const updateArticleData: Article = await this.article.update({ where: { id: articleId }, data: { ...articleData, slug } });

    await this.categoryArticleLink.deleteMany({ where: { article_id: articleId } });
    await this.mediaArticleLink.deleteMany({ where: { article_id: articleId } });

    categories.map(async category => {
      await this.categoryArticleLink.create({ data: { category_id: category, article_id: updateArticleData.id } });
    });

    medias.map(async media => {
      await this.mediaArticleLink.create({ data: { media_id: media, article_id: updateArticleData.id } });
    });

    return updateArticleData;
  }

  public async deleteArticle(articleId: number): Promise<Article> {
    const findArticle: Article = await this.article.findUnique({ where: { id: articleId } });
    if (!findArticle) throw new HttpException(409, "Article doesn't exist");
    const deleteCategoriesLink = await this.categoryArticleLink.deleteMany({ where: { article_id: articleId } });
    const deleteMediasLink = await this.mediaArticleLink.deleteMany({ where: { article_id: articleId } });
    const deleteArticleData = await this.article.delete({ where: { id: articleId } });
    return deleteArticleData;
  }
}
