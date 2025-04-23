import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration keys
const MASTRA_BASE_URL_KEY = 'MASTRA_BASE_URL';
const MASTRA_API_KEY_KEY = 'MASTRA_API_KEY';
const MASTRA_AGENT_ID_KEY = 'MASTRA_AGENT_ID';

// Default values
const DEFAULT_BASE_URL = 'https://api.mastra.ai';
const DEFAULT_AGENT_ID = 'personal-assistant';

export interface MastraConfig {
  baseUrl: string;
  apiKey: string;
  agentId: string;
}

// Save Mastra configuration to AsyncStorage
export const saveMastraConfig = async (config: MastraConfig): Promise<void> => {
  try {
    await AsyncStorage.setItem(MASTRA_BASE_URL_KEY, config.baseUrl);
    await AsyncStorage.setItem(MASTRA_API_KEY_KEY, config.apiKey);
    await AsyncStorage.setItem(MASTRA_AGENT_ID_KEY, config.agentId);
    console.log('Mastra configuration saved successfully');
  } catch (error) {
    console.error('Error saving Mastra configuration:', error);
    throw error;
  }
};

// Load Mastra configuration from AsyncStorage
export const loadMastraConfig = async (): Promise<MastraConfig> => {
  try {
    const baseUrl = await AsyncStorage.getItem(MASTRA_BASE_URL_KEY) || DEFAULT_BASE_URL;
    const apiKey = await AsyncStorage.getItem(MASTRA_API_KEY_KEY) || '';
    const agentId = await AsyncStorage.getItem(MASTRA_AGENT_ID_KEY) || DEFAULT_AGENT_ID;
    
    return { baseUrl, apiKey, agentId };
  } catch (error) {
    console.error('Error loading Mastra configuration:', error);
    // Return default values if loading fails
    return {
      baseUrl: DEFAULT_BASE_URL,
      apiKey: '',
      agentId: DEFAULT_AGENT_ID
    };
  }
};

// Clear all Mastra configuration
export const clearMastraConfig = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(MASTRA_BASE_URL_KEY);
    await AsyncStorage.removeItem(MASTRA_API_KEY_KEY);
    await AsyncStorage.removeItem(MASTRA_AGENT_ID_KEY);
    console.log('Mastra configuration cleared successfully');
  } catch (error) {
    console.error('Error clearing Mastra configuration:', error);
    throw error;
  }
};
