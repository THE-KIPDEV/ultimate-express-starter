import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { Media } from '@interfaces/medias.interface';
import { MediaService } from '@services/medias.service';

export class MediaController {
  public media = Container.get(MediaService);

  public getMedias = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const findAllMedias: Media[] = await this.media.findAllMedias(req.user);

      res.status(200).json({ data: findAllMedias, message: 'findAll' });
    } catch (error) {
      next(error);
    }
  };

  public createAudioVideoMedia = async (req: Request, res: Responsive, next: NextFunction): Promise<void> => {
    try {
      const mediaData: Media = req.body;
      const file = req.file;

      const createMediaData: Media = await this.media.createAudioVideoMedia(mediaData, req.user, file);

      res.status(201).json({ data: createMediaData, message: 'created' });
    } catch (error) {
      next(error);
    }
  };

  public getMediaById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const mediaId = Number(req.params.id);
      const findOneMedia: Media = await this.media.findMediaById(mediaId, req.user);

      res.status(200).json({ data: findOneMedia, message: 'findOne' });
    } catch (error) {
      next(error);
    }
  };

  public createMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const mediaData: Media = req.body;
      const createMediaData: Media = await this.media.createMedia(mediaData, req.user);

      res.status(201).json({ data: createMediaData, message: 'created' });
    } catch (error) {
      next(error);
    }
  };

  public updateMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const mediaId = Number(req.params.id);
      const mediaData: Media = req.body;
      const updateMediaData: Media = await this.media.updateMedia(mediaId, mediaData);

      res.status(200).json({ data: updateMediaData, message: 'updated' });
    } catch (error) {
      next(error);
    }
  };

  public deleteMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const mediaId = Number(req.params.id);
      const deleteMediaData: Media = await this.media.deleteMedia(mediaId);

      res.status(200).json({ data: deleteMediaData, message: 'deleted' });
    } catch (error) {
      next(error);
    }
  };
}
