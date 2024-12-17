import winston from 'winston';
import chalk from 'chalk';

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';

class Logger {
  private logger: winston.Logger;

  constructor() {
    // Custom color configuration
    const colorConfiguration = {
      levels: {
        error: 0,
        warn: 1,
        info: 2,
        success: 3
      },
      colors: {
        error: 'red',
        warn: 'yellow',
        info: 'blue',
        success: 'green'
      }
    };

    // Create a custom formatter
    const customFormatter = winston.format.printf(({ level, message, timestamp, ...context }) => {
      const colorMap: Record<LogLevel, (text: string) => string> = {
        'INFO': chalk.blue,
        'WARN': chalk.yellow,
        'ERROR': chalk.red,
        'SUCCESS': chalk.green
      };

      const color = colorMap[level.toUpperCase() as LogLevel] || chalk.white;
      const contextStr = Object.keys(context).length > 0 
        ? '\n' + JSON.stringify(context, null, 2)
        : '';
      
      return `${timestamp} [${color(level)}] ${message}${contextStr}`;
    });

    this.logger = winston.createLogger({
      levels: colorConfiguration.levels,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
        customFormatter
      ),
      transports: [
        // Console transport with colors
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize({ all: true }),
            winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
            customFormatter
          )
        }),
        // File transport for each log level
        new winston.transports.File({ 
          filename: 'logs/error.log', 
          level: 'error'
        }),
        new winston.transports.File({ 
          filename: 'logs/combined.log' 
        })
      ]
    });

    // Add colors
    winston.addColors(colorConfiguration.colors);
  }

  private log(level: LogLevel, message: string, context: Record<string, any> = {}) {
    switch (level) {
      case 'INFO':
        this.logger.info(message, context);
        break;
      case 'WARN':
        this.logger.warn(message, context);
        break;
      case 'ERROR':
        this.logger.error(message, context);
        break;
      case 'SUCCESS':
        this.logger.log('success', message, context);
        break;
    }
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
export default logger;