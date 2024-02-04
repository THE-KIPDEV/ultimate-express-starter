import { PrismaClient } from '@prisma/client';
import { Service } from 'typedi';
import { Message } from '@interfaces/messages.interface';
import { ConversationUser } from '@interfaces/conversationsUsers.interface';
import { User } from '../interfaces/users.interface';
import { Conversation } from '@interfaces/conversations.interface';
import { CreateUserConversationDto } from '../dtos/conversations.dto';
import { CreateMessageDto } from '@/dtos/messages.dto';
import { socketInstance } from '@/server';

@Service()
export class ConversationService {
  public message = new PrismaClient().message;
  public conversation = new PrismaClient().conversation;
  public conversationUser = new PrismaClient().conversationUser;
  public user = new PrismaClient().user;

  public async formatConversartion(conversation: Conversation): Promise<Conversation> {
    const findUserConversation = await this.conversationUser.findMany({ where: { conversation_id: conversation.id } });
    const users = [];

    const userCreateConversation = await this.user.findUnique({ where: { id: conversation.user_id } });
    users.push({ first_name: userCreateConversation.first_name, last_name: userCreateConversation.last_name, id: userCreateConversation.id });
    for (const userConversation of findUserConversation) {
      const user = await this.user.findUnique({ where: { id: userConversation.user_id } });

      users.push({ first_name: user.first_name, last_name: user.last_name, id: user.id });
    }

    const findMessagesConversation = await this.message.findMany({ where: { conversation_id: conversation.id } });
    const messages = [];

    for (const message of findMessagesConversation) {
      const user = await this.user.findUnique({ where: { id: message.user_id } });
      messages.push({ ...message, user: { first_name: user.first_name, last_name: user.last_name, id: user.id } });
    }

    const conversationData = {
      ...conversation,
      users,
      messages,
    };

    return conversationData;
  }

  public async findAllConversations(user: User): Promise<Conversation[]> {
    const allConversations: Conversation[] = await this.conversation.findMany({ where: { user_id: user.id } });
    const allConversationIn = await this.conversationUser.findMany({ where: { user_id: user.id } });

    for (const conversationIn of allConversationIn) {
      const conversation = await this.conversation.findUnique({ where: { id: conversationIn.conversation_id } });
      allConversations.push(conversation);
    }
    return await Promise.all(allConversations.map(async conversation => await this.formatConversartion(conversation)));
  }

  public async findConversationById(conversationId: number, user: User): Promise<Conversation> {
    const findConversation: Conversation | null = await this.conversation.findUnique({ where: { id: conversationId } });
    if (!findConversation) throw new Error("Conversation doesn't exist");

    if (user.id !== findConversation.user_id) {
      const findUserConversation = await this.conversationUser.findFirst({ where: { user_id: user.id, conversation_id: conversationId } });
      if (!findUserConversation) throw new Error("You can't see this conversation");
    }

    return await this.formatConversartion(findConversation);
  }

  public async createConversation(user: User): Promise<Conversation> {
    const createConversationData: Conversation = await this.conversation.create({ data: { user_id: user.id } });
    return createConversationData;
  }

  public async deleteConversation(conversationId: number, user: User): Promise<Conversation> {
    const findConversation: Conversation | null = await this.conversation.findUnique({ where: { id: conversationId } });
    if (!findConversation) throw new Error("Conversation doesn't exist");

    if (findConversation.user_id !== user.id) throw new Error("You can't delete this conversation");

    await this.conversationUser.deleteMany({ where: { conversation_id: conversationId } });
    await this.message.deleteMany({ where: { conversation_id: conversationId } });

    const deleteConversationData = await this.conversation.delete({ where: { id: conversationId } });

    return deleteConversationData;
  }

  public async createMessage(conversationId: number, messageData: CreateMessageDto, user: User): Promise<Message> {
    const findConversation = await this.conversation.findUnique({ where: { id: conversationId } });
    if (!findConversation) throw new Error("Conversation doesn't exist");

    if (user.id !== findConversation.user_id) {
      const findUserConversation = await this.conversationUser.findFirst({ where: { user_id: user.id, conversation_id: conversationId } });
      if (!findUserConversation) throw new Error("You can't send message to this conversation");
    }

    const createMessageData: Message = await this.message.create({
      data: { content: messageData.content, user_id: user.id, conversation_id: conversationId },
    });

    // Get all user in conversation
    const findUserConversation = await this.conversationUser.findMany({ where: { conversation_id: conversationId } });

    findUserConversation.forEach(async userConversation => {
      const user = await this.user.findUnique({ where: { id: userConversation.user_id } });
      socketInstance.to(user.socket_id).emit('message', createMessageData);
    });

    const userCreateConversation = await this.user.findUnique({ where: { id: findConversation.user_id } });
    socketInstance.to(userCreateConversation.socket_id).emit('message', createMessageData);

    return createMessageData;
  }

  public async updateMessage(messageId: number, messageData: CreateMessageDto, user: User): Promise<Message> {
    const findMessage: Message | null = await this.message.findUnique({ where: { id: messageId } });
    if (!findMessage) throw new Error("Message doesn't exist");

    if (findMessage.user_id !== user.id) throw new Error("You can't update this message");

    const updateMessageData: Message = await this.message.update({ where: { id: messageId }, data: { content: messageData.content } });
    return updateMessageData;
  }

  public async deleteMessage(messageId: number, user: User): Promise<Message> {
    const findMessage: Message | null = await this.message.findUnique({ where: { id: messageId } });
    if (!findMessage) throw new Error("Message doesn't exist");

    if (findMessage.user_id !== user.id) throw new Error("You can't update this message");

    const deleteMessageData: Message = await this.message.delete({ where: { id: messageId } });
    return deleteMessageData;
  }

  public async createUserConversation(conversationId: number, userData: CreateUserConversationDto, user: User): Promise<ConversationUser> {
    const findConversation = await this.conversation.findUnique({ where: { id: conversationId } });
    if (!findConversation) throw new Error("Conversation doesn't exist");

    if (findConversation.user_id !== user.id) throw new Error("You can't add user to this conversation");

    if (user.id === userData.user_id) throw new Error("You can't add yourself to this conversation");

    const findUserConversation = await this.conversationUser.findFirst({ where: { user_id: userData.user_id, conversation_id: conversationId } });
    if (findUserConversation) throw new Error('User already in conversation');

    const createUserConversationData: ConversationUser = await this.conversationUser.create({
      data: { user_id: userData.user_id, conversation_id: conversationId },
    });

    return createUserConversationData;
  }

  public async deleteUserConversation(conversationId: number, userData: CreateUserConversationDto, user: User): Promise<ConversationUser> {
    const findConversation = await this.conversation.findUnique({ where: { id: conversationId } });
    if (!findConversation) throw new Error("Conversation doesn't exist");

    const findUserConversation = await this.conversationUser.findFirst({ where: { user_id: userData.user_id, conversation_id: conversationId } });

    const deleteUserConversationData: ConversationUser = await this.conversationUser.delete({
      where: { id: findUserConversation.id },
    });

    return deleteUserConversationData;
  }
}
