/**
 * Gemini function declarations for all DevToolkit tools.
 * Each declaration describes the tool so Gemini knows when and how to call it.
 */
export const toolDeclarations = {
  functionDeclarations: [
    {
      name: 'generateUUID',
      description:
        'Generates one or more universally unique identifiers (UUID v4). Useful when the user needs random IDs, unique keys, or identifiers for any purpose.',
      parameters: {
        type: 'OBJECT',
        properties: {
          count: {
            type: 'NUMBER',
            description:
              'How many UUIDs to generate. Defaults to 1 if not specified.',
          },
        },
        required: [],
      },
    },
    {
      name: 'generatePassword',
      description:
        'Generates a cryptographically secure random password with configurable length and character options.',
      parameters: {
        type: 'OBJECT',
        properties: {
          length: {
            type: 'NUMBER',
            description: 'Length of the password (8–128). Defaults to 16.',
          },
          includeUppercase: {
            type: 'BOOLEAN',
            description: 'Include uppercase letters. Defaults to true.',
          },
          includeLowercase: {
            type: 'BOOLEAN',
            description: 'Include lowercase letters. Defaults to true.',
          },
          includeNumbers: {
            type: 'BOOLEAN',
            description: 'Include digits 0-9. Defaults to true.',
          },
          includeSymbols: {
            type: 'BOOLEAN',
            description:
              'Include special symbols (!@#$%^&*). Defaults to true.',
          },
        },
        required: [],
      },
    },
    {
      name: 'hashText',
      description:
        'Computes the cryptographic hash of a given text string using the specified algorithm (sha256, sha512, or md5).',
      parameters: {
        type: 'OBJECT',
        properties: {
          text: {
            type: 'STRING',
            description: 'The text to hash.',
          },
          algorithm: {
            type: 'STRING',
            enum: ['sha256', 'sha512', 'md5'],
            description:
              'The hash algorithm to use. Defaults to sha256 if not specified.',
          },
        },
        required: ['text'],
      },
    },
    {
      name: 'base64Encode',
      description:
        'Encodes a plain text string into its Base64 representation.',
      parameters: {
        type: 'OBJECT',
        properties: {
          text: {
            type: 'STRING',
            description: 'The text to encode in Base64.',
          },
        },
        required: ['text'],
      },
    },
    {
      name: 'base64Decode',
      description:
        'Decodes a Base64-encoded string back to plain text. Returns an error if the input is not valid Base64.',
      parameters: {
        type: 'OBJECT',
        properties: {
          encoded: {
            type: 'STRING',
            description: 'The Base64-encoded string to decode.',
          },
        },
        required: ['encoded'],
      },
    },
    {
      name: 'timestampConvert',
      description:
        'Converts between Unix timestamps (seconds or milliseconds) and human-readable ISO 8601 date strings. Can convert in both directions. Also accepts "now" to get the current timestamp.',
      parameters: {
        type: 'OBJECT',
        properties: {
          value: {
            type: 'STRING',
            description:
              'Either a Unix timestamp (number as string), an ISO date string, or "now" for the current time.',
          },
        },
        required: ['value'],
      },
    },
    {
      name: 'jsonValidate',
      description:
        'Validates a JSON string and returns it formatted (pretty-printed) if valid, or returns the parsing error if invalid.',
      parameters: {
        type: 'OBJECT',
        properties: {
          jsonString: {
            type: 'STRING',
            description: 'The JSON string to validate and format.',
          },
        },
        required: ['jsonString'],
      },
    },
    {
      name: 'colorConvert',
      description:
        'Converts colors between HEX and RGB formats. Accepts either a HEX color string (e.g. "#FF5733" or "FF5733") or an RGB object, and returns both representations.',
      parameters: {
        type: 'OBJECT',
        properties: {
          hex: {
            type: 'STRING',
            description:
              'A HEX color string like "#FF5733" or "FF5733". Provide this OR rgb values.',
          },
          r: {
            type: 'NUMBER',
            description: 'Red channel value (0-255). Used with g and b.',
          },
          g: {
            type: 'NUMBER',
            description: 'Green channel value (0-255). Used with r and b.',
          },
          b: {
            type: 'NUMBER',
            description: 'Blue channel value (0-255). Used with r and g.',
          },
        },
        required: [],
      },
    },
  ],
};
