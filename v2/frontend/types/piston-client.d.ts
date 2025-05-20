declare module 'piston-client' {
  interface PistonOptions {
    server?: string;
  }

  interface PistonRuntime {
    language: string;
    version: string;
    aliases: string[];
  }

  interface PistonFile {
    name: string;
    content: string;
  }

  interface PistonExecuteOptions {
    language: string;
    version?: string;
    files: PistonFile[];
    stdin?: string;
    args?: string[];
    compileTimeout?: number;
    runTimeout?: number;
    compileMemoryLimit?: number;
    runMemoryLimit?: number;
  }

  interface PistonRunResult {
    stdout: string;
    stderr: string;
    code: number;
    signal: string | null;
    output: string;
    time: number;
  }

  interface PistonExecuteResult {
    language: string;
    version: string;
    run: PistonRunResult;
    success?: boolean;
    error?: {
      message: string;
    };
  }

  interface PistonClient {
    runtimes(): Promise<PistonRuntime[]>;
    execute(language: string, code: string, config?: any): Promise<PistonExecuteResult>;
    execute(config: PistonExecuteOptions): Promise<PistonExecuteResult>;
  }

  function piston(options?: PistonOptions): PistonClient;

  export default piston;
}