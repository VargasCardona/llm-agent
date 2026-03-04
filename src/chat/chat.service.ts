import { GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { toolDeclarations } from '../tools/tool-declarations';
import { ToolsService } from '../tools/tools.service';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

interface ChatHistory {
  messages: ChatMessage[];
  params: { temperature: number };
  total_tokens_acumulados: number;
}

export interface ChatResponse {
  response: string;
  tokensInput: number;
  tokensOutput: number;
  totalTokensAccumulated: number;
  toolUsed: string | null;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: any;
  private readonly sessionsDir: string;

  /**
   * System instruction that shapes the agent's personality.
   * Uses concise instructions to reduce token overhead on every request.
   */
  private readonly systemInstruction = [
    'You are DevToolkit, a concise developer utility assistant.',
    'You have 8 tools: generateUUID, generatePassword, hashText, base64Encode, base64Decode, timestampConvert, jsonValidate, colorConvert.',
    'Rules:',
    '- Use tools when the user asks for something a tool can do.',
    '- Present tool results clearly and briefly.',
    '- If the user asks something unrelated to dev utilities, answer briefly but suggest your tools.',
    '- Always respond in the same language the user writes in.',
    '- Keep answers short; avoid unnecessary filler.',
  ].join(' ');

  constructor(
    private readonly configService: ConfigService,
    private readonly toolsService: ToolsService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    const modelName = this.configService.get<string>('GEMINI_MODEL_NAME');

    if (!apiKey || !modelName) {
      throw new Error('GEMINI_API_KEY or GEMINI_MODEL_NAME is not set in .env');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: modelName,
      tools: [toolDeclarations as any],
      systemInstruction: this.systemInstruction,
    });

    this.sessionsDir = path.join(process.cwd(), 'sessions');
    if (!fs.existsSync(this.sessionsDir)) {
      fs.mkdirSync(this.sessionsDir, { recursive: true });
    }
  }

  private getHistoryPath(sessionId: string): string {
    return path.join(this.sessionsDir, `chat_history_${sessionId}.json`);
  }

  private loadHistory(sessionId: string): ChatHistory {
    const historyPath = this.getHistoryPath(sessionId);
    if (!fs.existsSync(historyPath)) {
      return {
        messages: [],
        params: { temperature: 0.7 },
        total_tokens_acumulados: 0,
      };
    }
    try {
      return JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
    } catch {
      return {
        messages: [],
        params: { temperature: 0.7 },
        total_tokens_acumulados: 0,
      };
    }
  }

  private saveHistory(data: ChatHistory, sessionId: string): void {
    const historyPath = this.getHistoryPath(sessionId);
    fs.writeFileSync(historyPath, JSON.stringify(data, null, 2));
  }

  /**
   * Main chat method — sends the user message to Gemini, handles tool calls,
   * tracks tokens, and persists history.
   */
  async chat(userMessage: string, sessionId?: string): Promise<ChatResponse> {
    const effectiveSessionId = sessionId || 'default';
    const data = this.loadHistory(effectiveSessionId);

    let totalInput = 0;
    let totalOutput = 0;
    let toolUsed: string | null = null;

    // Build history for Gemini (only keeps last 20 messages to limit token usage)
    const recentMessages = data.messages.slice(-20);
    const formattedHistory = recentMessages.map((m) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const chatSession = this.model.startChat({
      history: formattedHistory,
      generationConfig: {
        temperature: data.params.temperature,
        maxOutputTokens: 1024,
      },
    });

    try {
      const result = await chatSession.sendMessage(userMessage);

      totalInput += result.response.usageMetadata?.promptTokenCount || 0;
      totalOutput += result.response.usageMetadata?.candidatesTokenCount || 0;

      const response = result.response;
      const call = response.candidates?.[0]?.content?.parts?.find(
        (p: any) => p.functionCall,
      );

      let finalResponseText = '';

      if (call) {
        const { name, args } = call.functionCall;
        toolUsed = name;

        this.logger.log(
          `Tool called: ${name} with args: ${JSON.stringify(args)}`,
        );

        // Execute the tool
        const toolResult = this.toolsService.executeTool(name, args);

        this.logger.log(`Tool result: ${JSON.stringify(toolResult)}`);

        // Send tool result back to Gemini for a natural language response
        const secondResponse = await chatSession.sendMessage([
          {
            functionResponse: {
              name,
              response: toolResult,
            },
          },
        ]);

        totalInput +=
          secondResponse.response.usageMetadata?.promptTokenCount || 0;
        totalOutput +=
          secondResponse.response.usageMetadata?.candidatesTokenCount || 0;

        finalResponseText = secondResponse.response.text();
      } else {
        finalResponseText = response.text();
      }

      // Update history
      data.messages.push({ role: 'user', content: userMessage });
      data.messages.push({ role: 'model', content: finalResponseText });
      data.total_tokens_acumulados += totalInput + totalOutput;

      this.saveHistory(data, effectiveSessionId);

      this.logger.log(
        `[Tokens] Input: ${totalInput} | Output: ${totalOutput} | Accumulated: ${data.total_tokens_acumulados}`,
      );

      return {
        response: finalResponseText,
        tokensInput: totalInput,
        tokensOutput: totalOutput,
        totalTokensAccumulated: data.total_tokens_acumulados,
        toolUsed,
      };
    } catch (error) {
      this.logger.error('Error in Gemini request:', error);
      throw error;
    }
  }

  /**
   * Reset conversation history.
   */
  resetHistory(sessionId?: string): void {
    const effectiveSessionId = sessionId || 'default';
    this.saveHistory(
      {
        messages: [],
        params: { temperature: 0.7 },
        total_tokens_acumulados: 0,
      },
      effectiveSessionId,
    );
  }
}
