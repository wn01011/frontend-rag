import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

class Logger {
  private logLevel: LogLevel;
  private logFile?: string;

  constructor() {
    this.logLevel = this.parseLogLevel(process.env.LOG_LEVEL || 'info');
    
    // Setup log file if in production
    if (process.env.NODE_ENV === 'production') {
      const logsDir = join(__dirname, '../../logs');
      if (!existsSync(logsDir)) {
        mkdirSync(logsDir, { recursive: true });
      }
      this.logFile = join(logsDir, `mcp-rag-${new Date().toISOString().split('T')[0]}.log`);
    }
  }

  private parseLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'error': return LogLevel.ERROR;
      case 'warn': return LogLevel.WARN;
      case 'info': return LogLevel.INFO;
      case 'debug': return LogLevel.DEBUG;
      default: return LogLevel.INFO;
    }
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? JSON.stringify(args) : '';
    return `[${timestamp}] [${level}] ${message} ${formattedArgs}`;
  }

  private log(level: LogLevel, levelStr: string, message: string, ...args: any[]) {
    if (level <= this.logLevel) {
      const formattedMessage = this.formatMessage(levelStr, message, ...args);
      
      // Console output
      switch (level) {
        case LogLevel.ERROR:
          console.error(formattedMessage);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage);
          break;
        default:
          console.log(formattedMessage);
      }
      
      // File output in production
      if (this.logFile) {
        import('fs').then(fs => {
          fs.appendFileSync(this.logFile!, formattedMessage + '\n');
        });
      }
    }
  }

  error(message: string, ...args: any[]) {
    this.log(LogLevel.ERROR, 'ERROR', message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.log(LogLevel.WARN, 'WARN', message, ...args);
  }

  info(message: string, ...args: any[]) {
    this.log(LogLevel.INFO, 'INFO', message, ...args);
  }

  debug(message: string, ...args: any[]) {
    this.log(LogLevel.DEBUG, 'DEBUG', message, ...args);
  }
}

export const logger = new Logger();