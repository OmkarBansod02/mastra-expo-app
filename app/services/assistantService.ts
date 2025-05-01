import { MastraClient } from '@mastra/client-js';
import { log, logError } from '../utils/config';
import { loadMastraConfig, MastraConfig } from '../utils/configStorage';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Initialize with null values, will be set when refreshClient is called
let client: any = null;
let agent: any = null;
let isInitialized = false;

const weatherAgentService = {
  // Initialize the client and agent with current settings
  refreshClient: async (): Promise<boolean> => {
    try {
      const config = await loadMastraConfig();
      log("Initializing Mastra client with config:", config);
      
      if (!config.baseUrl) {
        logError("No Mastra URL configured");
        client = null;
        agent = null;
        isInitialized = false;
        return false;
      }
      
      // Create new client with current settings
      client = new MastraClient({
        baseUrl: config.baseUrl,
      });
      
      // Get the agent with current agent ID
      agent = client.getAgent(config.agentId);
      isInitialized = true;
      
      log("Mastra client initialized successfully");
      return true;
    } catch (error) {
      logError("Error initializing Mastra client:", error);
      client = null;
      agent = null;
      isInitialized = false;
      return false;
    }
  },
  
  isConfigured: (): boolean => {
    // If not yet initialized, try to initialize now
    if (!isInitialized) {
      // We need to initialize but can't await in a sync function
      // So we trigger the initialization asynchronously and return false for now
      weatherAgentService.refreshClient()
        .then((success) => {
          isInitialized = success;
        })
        .catch(() => {
          isInitialized = false;
        });
      return false;
    }
    
    return !!agent;
  },
  
  sendMessage: async (content: string): Promise<Message> => {
    try {
      // Make sure client is initialized
      if (!isInitialized) {
        await weatherAgentService.refreshClient();
        
        if (!agent) {
          throw new Error("Mastra client not properly configured");
        }
      }
      
      log("Sending message to agent");
      const response = await agent.generate({
        messages: [
          { role: 'user', content }
        ]
      });
      log("Response received:", response);
      const responseText = typeof response === 'string' 
        ? response 
        : (response as any).text || JSON.stringify(response);
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
      };
    } catch (error) {
      logError('Error sending message:', error);
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Sorry, I couldn't process your request. Please try again.",
        timestamp: new Date(),
      };
    }
  },

  streamMessage: async (content: string, onChunk: (chunk: string) => void): Promise<Message> => {
    try {
      // Make sure client is initialized
      if (!isInitialized) {
        await weatherAgentService.refreshClient();
        
        if (!agent) {
          throw new Error("Mastra client not properly configured");
        }
      }
      
      log("Streaming message to agent");
      let fullContent = '';
      let streamingSuccessful = false;

      try {
        const streamResponse = await agent.stream({
          messages: [
            { role: 'user', content }
          ]
        });
        log("Stream response received:", streamResponse ? 'valid response' : 'null response');

        if (streamResponse) {
          if (typeof streamResponse.processDataStream === 'function') {
            log("Using processDataStream method");
            await streamResponse.processDataStream({
              onTextPart: (text: string) => {
                log("Received text part:", text ? text.substring(0, 20) + '...' : 'empty');
                if (text) {
                  fullContent += text;
                  onChunk(text);
                  streamingSuccessful = true;
                }
              },
              onErrorPart: (error: any) => {
                log('Stream error part:', error);
              }
            });
          } else if (streamResponse.body) {
            log("Using response.body");
            const reader = streamResponse.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const text = decoder.decode(value, { stream: true });
              log("Received chunk:", text ? text.substring(0, 20) + '...' : 'empty');
              fullContent += text;
              onChunk(text);
              streamingSuccessful = true;
            }
          } else if (typeof streamResponse === 'string') {
            log("Received string response");
            fullContent = streamResponse;
            onChunk(streamResponse);
            streamingSuccessful = true;
          } else if ((streamResponse as any).text) {
            log("Using response.text property");
            fullContent = (streamResponse as any).text;
            onChunk(fullContent);
            streamingSuccessful = true;
          } else if ((streamResponse as any).content) {
            log("Using response.content property");
            fullContent = (streamResponse as any).content;
            onChunk(fullContent);
            streamingSuccessful = true;
          } else {
            log("Falling back to JSON.stringify");
            const stringified = JSON.stringify(streamResponse);
            fullContent = stringified;
            onChunk(stringified);
            streamingSuccessful = true;
          }
        }
      } catch (streamError) {
        const isNoResponseBodyError = 
          streamError && 
          streamError.toString && 
          streamError.toString().includes("No response body");

        if (isNoResponseBodyError) {
          log("Stream not supported on this server, using regular generate instead");
        } else {
          logError("Error in streaming:", streamError);
        }
      }

      if (!streamingSuccessful) {
        log("Falling back to regular generate method");

        try {
          const response = await agent.generate({
            messages: [
              { role: 'user', content }
            ]
          });
          log("Fallback response received:", response);

          const responseText = typeof response === 'string' 
            ? response 
            : (response as any).text || JSON.stringify(response);

          fullContent = responseText;
          onChunk(responseText);
        } catch (generateError) {
          logError("Error in fallback generate:", generateError);
          throw generateError;
        }
      }

      log("Message handling completed, content length:", fullContent.length);

      if (!fullContent) {
        const defaultMessage = "I'm sorry, I couldn't generate a response for your query.";
        fullContent = defaultMessage;
        onChunk(defaultMessage);
      }

      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: fullContent,
        timestamp: new Date(),
      };
    } catch (error) {
      logError('Error handling message:', error);
      const errorMessage = "Sorry, I couldn't process your request. Please try again.";
      onChunk(errorMessage);
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date(),
      };
    }
  }
};

// Initialize the client on import
weatherAgentService.refreshClient();

export default weatherAgentService;