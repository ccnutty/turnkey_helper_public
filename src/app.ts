import { startWebServer } from './web_server';

const startServices = async () => {
  try {
    // 并行启动Web服务和Telegram机器人服务
    await Promise.all([startWebServer()]);
    console.log('app services have started successfully');
  } catch (error) {
    console.error('Error starting services:', error);
    process.exit(1);
  }
};

startServices();