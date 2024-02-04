import { Router } from 'express';
import { ConversationController } from '@controllers/conversations.controller';
import { CreateMessageDto } from '@dtos/messages.dto';
import { CreateUserConversationDto } from '@dtos/conversations.dto';
import { Routes } from '@interfaces/routes.interface';
import { ValidationMiddleware } from '@middlewares/validation.middleware';
import { AuthMiddleware } from '../middlewares/auth.middleware';

export class ConversationRoute implements Routes {
  public path = '/conversations';
  public router = Router();
  public conversation = new ConversationController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, AuthMiddleware, this.conversation.getConversations);
    this.router.get(`${this.path}/:id`, AuthMiddleware, this.conversation.getConversationsById);

    this.router.post(`${this.path}/message/:id`, AuthMiddleware, ValidationMiddleware(CreateMessageDto), this.conversation.createMessage);
    this.router.put(`${this.path}/message/:id`, AuthMiddleware, ValidationMiddleware(CreateMessageDto), this.conversation.updateMessage);
    this.router.delete(`${this.path}/message/:id`, AuthMiddleware, this.conversation.deleteMessage);

    this.router.post(`${this.path}`, AuthMiddleware, this.conversation.createConversation);
    this.router.delete(`${this.path}/:id`, AuthMiddleware, this.conversation.deleteConversation);

    this.router.post(
      `${this.path}/add-user/:id`,
      AuthMiddleware,
      ValidationMiddleware(CreateUserConversationDto),
      this.conversation.createUserConversation,
    );
    this.router.post(
      `${this.path}/delete-user/:id`,
      AuthMiddleware,
      ValidationMiddleware(CreateUserConversationDto),
      this.conversation.deleteUserConversation,
    );
  }
}
