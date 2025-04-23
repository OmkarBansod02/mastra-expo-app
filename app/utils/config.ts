import { PERSONAL_ASSISTANT_URL, ENABLE_LOGGING } from '@env';

export const personalAssistantUrl: string = PERSONAL_ASSISTANT_URL || 'http://localhost:4111';
export const mastraAgentId: string = 'weatherAgent';
export const enableLogging: boolean = ENABLE_LOGGING === 'true' || ENABLE_LOGGING === true;

export const log = (message: string, data?: any): void => {
  if (enableLogging) {
    if (data) {
      console.log(`[PA-APP] ${message}`, data);
    } else {
      console.log(`[PA-APP] ${message}`);
    }
  }
};

export const logError = (message: string, error?: any): void => {
  if (error) {
    console.error(`[PA-APP ERROR] ${message}`, error);
  } else {
    console.error(`[PA-APP ERROR] ${message}`);
  }
};
