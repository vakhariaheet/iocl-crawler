import chalk from 'chalk';
import { config } from '../config/env.js';

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';

class Logger {
  private getColor(level: LogLevel) {
    return {
      INFO: chalk.blue,
      WARN: chalk.yellow,
      ERROR: chalk.red,
      SUCCESS: chalk.green
    }[level];
  }

  private log(level: LogLevel, message: string, context: Record<string, any> = {}) {
    const color = this.getColor(level);
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(context).length > 0 
      ? JSON.stringify(context, null, 2)
      : '';

    console.log(
      `${timestamp} [${color(level)}] ${message}${contextStr ? '\n' + contextStr : ''}`
    );
  }

  info(message: string, context?: Record<string, any>) {
    this.log('INFO', message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('WARN', message, context);
  }

  error(message: string, context?: Record<string, any>) {
    this.log('ERROR', message, context);
  }

  success(message: string, context?: Record<string, any>) {
    this.log('SUCCESS', message, context);
  }
}

export const logger = new Logger();