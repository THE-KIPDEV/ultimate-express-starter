import { PrismaClient } from '@prisma/client';
import { Service } from 'typedi';
import { CreateMediaDto } from '@dtos/medias.dto';
import { HttpException } from '@/exceptions/httpException';
import { Media } from '@interfaces/medias.interface';
import { User } from '@interfaces/users.interface';
import { v4 as uuid } from 'uuid';
import sharp from 'sharp';
import fs from 'fs';
import * as AWS from 'aws-sdk';

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
      if (!findMedia) throw new HttpException(409, 'MEDIA_NOT_FOUND');

      if (findMedia.type === 'video' || findMedia.type === 'audio') {
        const s3 = new AWS.S3({
          signature: 'v4',
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          region: 'eu-north-1',
        });
        const s3Params = {
          Bucket: 'hello',
          Key: findMedia.url,
        };
        const signedUrl = await s3.getSignedUrlPromise('getObject', s3Params);
        findMedia.url = signedUrl;
      }

      return await this.formatMedia(findMedia);
    } else {
      const findMedia: Media = await this.media.findFirst({ where: { id: mediaId, security: 'public' } });
      if (!findMedia) throw new HttpException(409, 'MEDIA_NOT_FOUND');

      return await this.formatMedia(findMedia);
    }
  }

  public async createAudioVideoMedia(mediaData: CreateMediaDto, user: User, file): Promise<Media> {
    const s3 = new AWS.S3({
      signature: 'v4',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: 'eu-north-1',
    });

    try {
      const MEDIA_SIZE = 1000 * 1024 * 1024; // Taille maximale autorisée du fichier

      if (file.size > MEDIA_SIZE) {
        throw new HttpException(409, 'MEDIA_TOO_BIG');
      }

      const fileExtension = mediaData.sub_type;
      const mediaName = uuid();
      const url = `${mediaData.type}/${mediaName}.${fileExtension}`;

      const s3Params = {
        Bucket: 'hello',
        Key: url,
        Body: file.buffer,
      };

      await s3.upload(s3Params).promise();

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
          weight: file.size, // Utilisez la taille du fichier plutôt que buffer.length
          security: mediaData.security,
        },
      });

      return createMediaData;
    } catch (error) {
      console.error(error);
      throw new HttpException(500, 'S3_FAILED');
    }
  }

  public async createMedia(mediaData: CreateMediaDto, user: User): Promise<Media> {
    // Stocker privé
    // Servir fichier privé
    const mediaName = uuid();
    const path = `./src/${mediaData.security}/${mediaData.type}`;

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
