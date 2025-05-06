import { createLogger, format, transports } from 'winston';
const { combine, timestamp, metadata, printf } = format;

const customFormat = printf((info) => {
  const { timestamp, level, message, metadata } = info;
  // 收窄并断言
  const metaObj = (typeof metadata === 'object' && metadata !== null)
    ? metadata as Record<string, unknown>
    : {};

  const metaString = Object.keys(metaObj).length
    ? JSON.stringify(metaObj, null, 2)
    : '';

  return `${timestamp} ${level}: ${message} ${metaString}`;
});

const logger = createLogger({
  format: combine(
    timestamp(),
    metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
    customFormat
  ),
  transports: [new transports.Console(),new transports.File({ filename: './logs/info.log' })],
});


// const logger = createLogger({
//     // 配置日志输出格式、目的地等
//     level: 'debug', // 日志级别
//     // level: 'info', // 日志级别
//     format: format.combine(
//       format.colorize(),
//       format.timestamp(),
//       customFormat
//     ),
//     transports: [
//       new transports.Console(), // 输出到控制台
//       new transports.File({ filename: './logs/info.log' }) // 输出到文件
//     ]
// })

export {logger}