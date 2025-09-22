declare module 'better-sqlite3' {
  interface RunResult {
    changes: number;
  }

  interface Statement {
    run(...params: any[]): RunResult;
    get(...params: any[]): any;
    all(...params: any[]): any[];
  }

  class BetterSqlite3Database {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): Statement;
    close(): void;
  }

  export type Database = BetterSqlite3Database;
  export default BetterSqlite3Database;
}

declare module 'sharp' {
  interface ResizeOptions {
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    withoutEnlargement?: boolean;
  }

  interface SharpInstance {
    metadata(): Promise<{ width?: number; height?: number; format?: string }>;
    jpeg(options?: { quality?: number; progressive?: boolean }): SharpInstance;
    resize(width?: number, height?: number, options?: ResizeOptions): SharpInstance;
    toFile(path: string): Promise<void>;
  }

  function sharp(input: string | Buffer): SharpInstance;
  export = sharp;
}

declare module 'openai' {
  interface OpenAIOptions {
    apiKey: string;
  }

  interface ChatCompletionMessage {
    role: string;
    content: Array<{ type: string; text?: string; image_url?: string }> | string;
  }

  interface ChatCompletionRequest {
    model: string;
    messages: ChatCompletionMessage[];
    temperature?: number;
    max_tokens?: number;
  }

  interface ChatCompletionResponse {
    id: string;
    model: string;
    usage?: Record<string, number>;
    choices: Array<{ message: { content: string }; finish_reason?: string }>;
  }

  class OpenAI {
    constructor(options: OpenAIOptions);
    chat: {
      completions: {
        create(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
      };
    };
  }

  export default OpenAI;
}
