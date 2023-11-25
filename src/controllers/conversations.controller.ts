import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { Conversation } from '@interfaces/conversations.interface';
import { ConversationService } from '@services/conversations.service';
import { Message } from '@interfaces/messages.interface';
import { ConversationUser } from '@interfaces/conversationsUsers.interface';

export class ConversationController {
  public conversation = Container.get(ConversationService);

  public getConversations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const findAllConversations: Conversation[] = await this.conversation.findAllConversations(req.user);

      res.status(200).json({ data: findAllConversations, message: 'findAll' });
    } catch (error) {
      next(error);
    }
  };

  public getConversationsById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const conversationId = Number(req.params.id);
      const findOneConversation: Conversation = await this.conversation.findConversationById(conversationId, req.user);

      res.status(200).json({ data: findOneConversation, message: 'findOne' });
    } catch (error) {
      next(error);
    }
  };

  public getNbConversationsNotRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const nbConversationsNotRead: number = await this.conversation.getNbConversationsNotRead(req.user);

      res.status(200).json({ data: nbConversationsNotRead, message: 'nb conversations not read' });
    } catch (error) {
      next(error);
    }
  };

  public createConversation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const conversationData: Conversation = req.body;
      const createConversationData: Conversation = await this.conversation.createConversation(conversationData, req.user);

      res.status(201).json({ data: createConversationData, message: 'created' });
    } catch (error) {
      next(error);
    }
  };

  public deleteConversation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const conversationId = Number(req.params.id);
      const deleteConversationData: Conversation = await this.conversation.deleteConversation(conversationId, req.user);

      res.status(200).json({ data: deleteConversationData, message: 'deleted' });
    } catch (error) {
      next(error);
    }
  };

  public createMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const conversationId = Number(req.params.id);
      const messageData: Message = req.body;
      const createMessageData: Message = await this.conversation.createMessage(conversationId, messageData, req.user);

      res.status(201).json({ data: createMessageData, message: 'message created' });
    } catch (error) {
      next(error);
    }
  };

  public updateMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const messageId = Number(req.params.id);
      const messageData: Message = req.body;
      const updateMessageData: Message = await this.conversation.updateMessage(messageId, messageData, req.user);

      res.status(200).json({ data: updateMessageData, message: 'message updated' });
    } catch (error) {
      next(error);
    }
  };

  public deleteMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const messageId = Number(req.params.id);
      const deleteMessageData: Message = await this.conversation.deleteMessage(messageId, req.user);

      res.status(200).json({ data: deleteMessageData, message: 'message deleted' });
    } catch (error) {
      next(error);
    }
  };

  public createUserConversation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const conversationId = Number(req.params.id);
      const userData: UserConversation = req.body;
      const createUserConversationData: ConversationUser = await this.conversation.createUserConversation(conversationId, userData, req.user);

      res.status(201).json({ data: createUserConversationData, message: 'user added to conversation' });
    } catch (error) {
      next(error);
    }
  };

  public deleteUserConversation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const conversationId = Number(req.params.id);
      const userId = Number(req.body.userId);
      const deleteUserConversationData: ConversationUser = await this.conversation.deleteUserConversation(conversationId, userId, req.user);

      res.status(200).json({ data: deleteUserConversationData, message: 'user removed from conversation' });
    } catch (error) {
      next(error);
    }
  };
}
