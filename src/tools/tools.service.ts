import { Injectable } from '@nestjs/common';
import { randomUUID, createHash, randomBytes } from 'crypto';

/**
 * Service that implements all 8 DevToolkit tools.
 * Each method receives args from Gemini's function call and returns a result object.
 */
@Injectable()
export class ToolsService {
  /**
   * Tool 1: Generate one or more UUID v4 identifiers.
   */
  generateUUID(args: { count?: number }): object {
    const count = Math.min(Math.max(args.count || 1, 1), 50);
    const uuids: string[] = [];
    for (let i = 0; i < count; i++) {
      uuids.push(randomUUID());
    }
    return { status: 'success', uuids, count };
  }

  /**
   * Tool 2: Generate a secure random password.
   */
  generatePassword(args: {
    length?: number;
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeNumbers?: boolean;
    includeSymbols?: boolean;
  }): object {
    const length = Math.min(Math.max(args.length || 16, 8), 128);
    const upper = args.includeUppercase !== false;
    const lower = args.includeLowercase !== false;
    const numbers = args.includeNumbers !== false;
    const symbols = args.includeSymbols !== false;

    let charset = '';
    if (upper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (lower) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (numbers) charset += '0123456789';
    if (symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!charset) charset = 'abcdefghijklmnopqrstuvwxyz0123456789';

    const bytes = randomBytes(length);
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset[bytes[i] % charset.length];
    }

    return {
      status: 'success',
      password,
      length,
      options: { upper, lower, numbers, symbols },
    };
  }

  /**
   * Tool 3: Hash text with a specified algorithm.
   */
  hashText(args: { text: string; algorithm?: string }): object {
    const algorithm = args.algorithm || 'sha256';
    const validAlgorithms = ['sha256', 'sha512', 'md5'];

    if (!validAlgorithms.includes(algorithm)) {
      return {
        status: 'error',
        message: `Invalid algorithm. Use one of: ${validAlgorithms.join(', ')}`,
      };
    }

    const hash = createHash(algorithm).update(args.text).digest('hex');

    return {
      status: 'success',
      algorithm,
      hash,
      inputLength: args.text.length,
    };
  }

  /**
   * Tool 4: Encode text to Base64.
   */
  base64Encode(args: { text: string }): object {
    const encoded = Buffer.from(args.text, 'utf-8').toString('base64');
    return {
      status: 'success',
      encoded,
      originalLength: args.text.length,
      encodedLength: encoded.length,
    };
  }

  /**
   * Tool 5: Decode Base64 to plain text.
   */
  base64Decode(args: { encoded: string }): object {
    try {
      const decoded = Buffer.from(args.encoded, 'base64').toString('utf-8');
      // Verify it was valid base64 by re-encoding
      const reEncoded = Buffer.from(decoded, 'utf-8').toString('base64');
      if (reEncoded !== args.encoded.replace(/\s/g, '')) {
        return { status: 'warning', decoded, note: 'Input may not be valid Base64.' };
      }
      return { status: 'success', decoded };
    } catch {
      return { status: 'error', message: 'Invalid Base64 string.' };
    }
  }

  /**
   * Tool 6: Convert between Unix timestamps and ISO date strings.
   */
  timestampConvert(args: { value: string }): object {
    const value = args.value.trim();

    if (value.toLowerCase() === 'now') {
      const now = new Date();
      return {
        status: 'success',
        iso: now.toISOString(),
        unixSeconds: Math.floor(now.getTime() / 1000),
        unixMilliseconds: now.getTime(),
        readable: now.toUTCString(),
      };
    }

    // Try as a number (unix timestamp)
    const num = Number(value);
    if (!isNaN(num) && isFinite(num)) {
      // Determine if seconds or milliseconds (timestamps > year 2100 in seconds ~= 4102444800)
      const ms = num > 9999999999 ? num : num * 1000;
      const date = new Date(ms);
      if (isNaN(date.getTime())) {
        return { status: 'error', message: 'Invalid timestamp value.' };
      }
      return {
        status: 'success',
        input: value,
        inputType: num > 9999999999 ? 'milliseconds' : 'seconds',
        iso: date.toISOString(),
        unixSeconds: Math.floor(date.getTime() / 1000),
        unixMilliseconds: date.getTime(),
        readable: date.toUTCString(),
      };
    }

    // Try as a date string
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return {
        status: 'error',
        message: `Could not parse "${value}" as a date or timestamp.`,
      };
    }

    return {
      status: 'success',
      input: value,
      inputType: 'dateString',
      iso: date.toISOString(),
      unixSeconds: Math.floor(date.getTime() / 1000),
      unixMilliseconds: date.getTime(),
      readable: date.toUTCString(),
    };
  }

  /**
   * Tool 7: Validate and pretty-print JSON.
   */
  jsonValidate(args: { jsonString: string }): object {
    try {
      const parsed = JSON.parse(args.jsonString);
      const formatted = JSON.stringify(parsed, null, 2);
      return {
        status: 'valid',
        formatted,
        type: Array.isArray(parsed) ? 'array' : typeof parsed,
        keys: typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
          ? Object.keys(parsed)
          : undefined,
      };
    } catch (err) {
      return {
        status: 'invalid',
        error: err instanceof Error ? err.message : 'Unknown parsing error',
      };
    }
  }

  /**
   * Tool 8: Convert between HEX and RGB color formats.
   */
  colorConvert(args: { hex?: string; r?: number; g?: number; b?: number }): object {
    // HEX → RGB
    if (args.hex) {
      let hex = args.hex.replace('#', '').trim();
      // Support shorthand (e.g. "F00" → "FF0000")
      if (hex.length === 3) {
        hex = hex
          .split('')
          .map((c) => c + c)
          .join('');
      }
      if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
        return { status: 'error', message: `Invalid HEX color: "${args.hex}"` };
      }
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return {
        status: 'success',
        hex: `#${hex.toUpperCase()}`,
        rgb: { r, g, b },
        cssRgb: `rgb(${r}, ${g}, ${b})`,
      };
    }

    // RGB → HEX
    if (args.r !== undefined && args.g !== undefined && args.b !== undefined) {
      const clamp = (v: number) => Math.min(255, Math.max(0, Math.round(v)));
      const r = clamp(args.r);
      const g = clamp(args.g);
      const b = clamp(args.b);
      const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
      return {
        status: 'success',
        hex,
        rgb: { r, g, b },
        cssRgb: `rgb(${r}, ${g}, ${b})`,
      };
    }

    return {
      status: 'error',
      message: 'Provide either a "hex" string or "r", "g", "b" values.',
    };
  }

  /**
   * Route a Gemini function call to the correct tool method.
   */
  executeTool(name: string, args: Record<string, any>): object {
    const toolMap: Record<string, (args: any) => object> = {
      generateUUID: (a) => this.generateUUID(a),
      generatePassword: (a) => this.generatePassword(a),
      hashText: (a) => this.hashText(a),
      base64Encode: (a) => this.base64Encode(a),
      base64Decode: (a) => this.base64Decode(a),
      timestampConvert: (a) => this.timestampConvert(a),
      jsonValidate: (a) => this.jsonValidate(a),
      colorConvert: (a) => this.colorConvert(a),
    };

    if (!toolMap[name]) {
      return { status: 'error', message: `Unknown tool: ${name}` };
    }

    return toolMap[name](args);
  }
}
