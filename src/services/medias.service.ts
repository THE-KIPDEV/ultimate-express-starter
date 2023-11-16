import { PrismaClient } from '@prisma/client';
import { Service } from 'typedi';
import { CreateMediaDto } from '@dtos/medias.dto';
import { HttpException } from '@/exceptions/httpException';
import { Media } from '@interfaces/medias.interface';
import { User } from '@interfaces/users.interface';
import { v4 as uuid } from 'uuid';
import sharp from 'sharp';
import fs from 'fs';

@Service()
export class MediaService {
  public media = new PrismaClient().medias;

  public async formatMedia(media: Media): Promise<Media> {
    if (media.formats !== '') {
      const format = JSON.parse(media.formats);
      const formatMedia = {
        ...media,
        formats: format,
      };
      return formatMedia;
    } else {
      return media;
    }
  }

  public async findAllMedias(user: User): Promise<Media[]> {
    if (user) {
      const allMedias: Media[] = await this.media.findMany();
      return Promise.all(allMedias.map(async media => await this.formatMedia(media)));
    } else {
      const allMedias: Media[] = await this.media.findMany({ where: { security: 'public' } });
      return Promise.all(allMedias.map(async media => await this.formatMedia(media)));
    }
  }

  public async findMediaById(mediaId: number, user: User): Promise<Media> {
    if (user) {
      const findMedia: Media = await this.media.findFirst({ where: { id: mediaId } });
      if (!findMedia) throw new HttpException(409, "Media doesn't exist");

      return await this.formatMedia(findMedia);
    } else {
      const findMedia: Media = await this.media.findFirst({ where: { id: mediaId, security: 'public' } });
      if (!findMedia) throw new HttpException(409, "Media doesn't exist");

      return await this.formatMedia(findMedia);
    }
  }

  public async createMedia(mediaData: CreateMediaDto, user: User): Promise<Media> {
    // Stocker privé
    // Servir fichier privé
    const mediaName = uuid();
    const path = `./${mediaData.security}/${mediaData.type}`;

    if (user && user.role === 'user') {
      const findsMediaUser = await this.media.findMany({ where: { created_by: user.id } });

      if (findsMediaUser.length > 5) {
        throw new HttpException(403, 'You have reached the limit of 5 media');
      }
    }

    if (user.role !== 'admin' && mediaData.security === 'private') throw new HttpException(403, 'You are not allowed to create private media');

    if (mediaData.type === 'image') {
      const buffer = Buffer.from(mediaData.file, 'base64');

      if (buffer.length > 250000) throw new HttpException(409, 'Media size is too big');

      const fullPath = `${path}/${mediaName}.${mediaData.sub_type}`;
      const url = `${mediaData.type}/${mediaName}.${mediaData.sub_type}`;
      const imgData = mediaData.file;
      const base64Data = imgData.replace(/^data:image\/\w+;base64,/, '');

      const base64DataRegex = new RegExp('^[A-Za-z0-9+/=]+$');
      if (!base64DataRegex.test(base64Data)) throw new HttpException(409, 'Media is corrupted');

      const imgExtension = imgData.split(';')[0].split('/')[1];

      if (imgExtension !== 'png' && imgExtension !== 'jpeg' && imgExtension !== 'jpg' && imgExtension !== 'webp') {
        throw new HttpException(409, 'Media extension is not valid');
      }

      fs.writeFileSync(fullPath, base64Data, { encoding: 'base64' });
      mediaData.format.map(async formatImage => {
        const [formatImageWith, formatImageHeight] = formatImage.split('x');
        await sharp(fullPath)
          .resize(Number(formatImageWith), Number(formatImageHeight), {
            fit: 'cover',
          })
          .png({ quality: 100 })
          .toFile(`${path}/${mediaName}-${formatImageWith}x${formatImageHeight}.${mediaData.sub_type}`)
          .then(() => {
            // console.log('Resize image success');
          });
      });

      const createMediaData: Media = await this.media.create({
        data: {
          name: mediaData.name,
          type: mediaData.type,
          url,
          sub_type: mediaData.sub_type,
          file_type: mediaData.file_type,
          formats: JSON.stringify(mediaData.format),
          created_by: user.id,
          updated_by: user.id,
          weight: buffer.length,
          security: mediaData.security,
        },
      });
      return createMediaData;
    } else if (mediaData.type === 'document') {
      const buffer = Buffer.from(mediaData.file, 'base64');

      if (buffer.length > 250000) throw new HttpException(409, 'Media size is too big');

      const fullPath = `${path}/${mediaName}.${mediaData.sub_type}`;
      const url = `${mediaData.type}/${mediaName}.${mediaData.sub_type}`;
      const fileData = mediaData.file;
      const base64Data = fileData.replace(/^data:([A-Za-z-+/]+);base64,/, '');
      fs.writeFileSync(fullPath, base64Data, { encoding: 'base64' });

      const base64DataRegex = new RegExp('^[A-Za-z0-9+/=]+$');
      if (!base64DataRegex.test(base64Data)) throw new HttpException(409, 'Media is corrupted');

      const fileExtension = fileData.split(';')[0].split('/')[1];

      if (fileExtension !== 'pdf' && fileExtension !== 'vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        throw new HttpException(409, 'Media extension is not valid');
      }
      const createMediaData: Media = await this.media.create({
        data: {
          name: mediaData.name,
          type: mediaData.type,
          url,
          sub_type: mediaData.sub_type,
          file_type: mediaData.file_type,
          formats: '',
          created_by: user.id,
          updated_by: user.id,
          weight: buffer.length,
          security: mediaData.security,
        },
      });

      return createMediaData;
    }
  }

  public async updateMedia(mediaId: number, mediaData: CreateMediaDto): Promise<Media> {
    const findMedia: Media = await this.media.findUnique({ where: { id: mediaId } });
    if (!findMedia) throw new HttpException(409, "Media doesn't exist");

    const updateMediaData = await this.media.update({ where: { id: mediaId }, data: { name: mediaData.name } });
    return updateMediaData;
  }

  public async deleteMedia(mediaId: number): Promise<Media> {
    const findMedia: Media = await this.media.findUnique({ where: { id: mediaId } });
    if (!findMedia) throw new HttpException(409, "Media doesn't exist");

    const deleteMediaData = await this.media.delete({ where: { id: mediaId } });
    return deleteMediaData;
  }
}
