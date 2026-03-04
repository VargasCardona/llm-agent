import { Controller, Post, Body, Delete, HttpCode } from '@nestjs/common';
import { ChatService } from './chat.service';

interface ChatBody {
  message: string;
  sessionId?: string;
}

@Controller('api')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('chat')
  async chat(@Body() body: ChatBody) {
    const message = body.message;
    const sessionId = body.sessionId;

    if (!message || !message.trim()) {
      return { error: 'Message is required' };
    }
    return this.chatService.chat(message.trim(), sessionId);
  }

  @Delete('history')
  @HttpCode(200)
  resetHistory(@Body() body: { sessionId?: string }) {
    const sessionId = body.sessionId;
    this.chatService.resetHistory(sessionId);
    return { status: 'ok', message: 'Chat history cleared.' };
  }
}
