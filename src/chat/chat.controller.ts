import { Controller, Post, Body, Delete, HttpCode } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('api')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('chat')
  async chat(@Body('message') message: string) {
    if (!message || !message.trim()) {
      return { error: 'Message is required' };
    }
    return this.chatService.chat(message.trim());
  }

  @Delete('history')
  @HttpCode(200)
  resetHistory() {
    this.chatService.resetHistory();
    return { status: 'ok', message: 'Chat history cleared.' };
  }
}
