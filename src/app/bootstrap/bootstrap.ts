import { appInitializer } from './appInitializer';
import { logger } from '../../utils/logger';

export const bootstrap = async (): Promise<void> => {
  try {
    await appInitializer.init();
    logger.info('Application bootstrapped successfully');
  } catch (error) {
    logger.error('Failed to bootstrap application', error);
  }
};
