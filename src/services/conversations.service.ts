import { PrismaClient } from '@prisma/client';
import { Service } from 'typedi';
import { ConversationService } from '@services/conversations.service';
import { Message } from '@interfaces/messages.interface';
import { ConversationUser } from '@interfaces/conversationsUsers.interface';

@Service()
export class ConversationService {
  public message = new PrismaClient().messages;
  public conversation = new PrismaClient().conversation;
  public conversationUser = new PrismaClient().conversationUser;

  public async findAllConversations(): Promise<Conversation[]> {
    const allConversations: Conversation[] = await this.prisma.conversation.findMany();
    return allConversations;
  }

  public async findConversationById(conversationId: number): Promise<Conversation> {
    const findConversation: Conversation | null = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!findConversation) throw new Error("Conversation doesn't exist");

    return findConversation;
  }

  public async createConversation(conversationData: Conversation): Promise<Conversation> {
    const createConversationData: Conversation = await this.prisma.conversation.create({ data: { ...conversationData } });
    return createConversationData;
  }

  public async deleteConversation(conversationId: number): Promise<Conversation> {
    const findConversation: Conversation | null = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!findConversation) throw new Error("Conversation doesn't exist");

    const deleteConversationData = await this.prisma.conversation.delete({ where: { id: conversationId } });
    return deleteConversationData;
  }

  public async createMessage(conversationId: number, messageData: Message): Promise<Message> {
    const createMessageData: Message = await this.prisma.message.create({ data: { ...messageData, conversationId } });
    return createMessageData;
  }

  public async updateMessage(messageId: number, messageData: Message): Promise<Message> {
    const findMessage: Message | null = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!findMessage) throw new Error("Message doesn't exist");

    const updateMessageData: Message = await this.prisma.message.update({ where: { id: messageId }, data: { ...messageData } });
    return updateMessageData;
  }
}
