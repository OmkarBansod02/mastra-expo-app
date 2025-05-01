import { MastraClient } from '@mastra/client-js';
import { log, logError } from '../utils/config';
import { loadMastraConfig } from '../utils/configStorage';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

let client: any = null;
let agent: any = null;
let isInitialized = false;

const mastraAgentService = {
  refreshClient: async (): Promise<boolean> => {
    try {
      const config = await loadMastraConfig();
      
      if (!config.baseUrl) {
        client = null;
        agent = null;
        isInitialized = false;
        return false;
      }
      
      client = new MastraClient({
        baseUrl: config.baseUrl,
      });
      
      agent = client.getAgent(config.agentId);
      isInitialized = true;
      
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
    if (!isInitialized) {
      mastraAgentService.refreshClient()
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
      if (!isInitialized) {
        await mastraAgentService.refreshClient();
        
        if (!agent) {
          throw new Error("Mastra client not properly configured");
        }
      }
      
      const response = await agent.generate({
        messages: [
          { role: 'user', content }
        ]
      });
      
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
      if (!isInitialized) {
        await mastraAgentService.refreshClient();
        
        if (!agent) {
          throw new Error("Mastra client not properly configured");
        }
      }
      
      let fullContent = '';
      let streamingSuccessful = false;

      try {
        const streamResponse = await agent.stream({
          messages: [
            { role: 'user', content }
          ]
        });

        if (streamResponse) {
          if (typeof streamResponse.processDataStream === 'function') {
            await streamResponse.processDataStream({
              onTextPart: (text: string) => {
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
            const reader = streamResponse.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const text = decoder.decode(value, { stream: true });
              fullContent += text;
              onChunk(text);
              streamingSuccessful = true;
            }
          } else if (typeof streamResponse === 'string') {
            fullContent = streamResponse;
            onChunk(streamResponse);
            streamingSuccessful = true;
          } else if ((streamResponse as any).text) {
            fullContent = (streamResponse as any).text;
            onChunk(fullContent);
            streamingSuccessful = true;
          } else if ((streamResponse as any).content) {
            fullContent = (streamResponse as any).content;
            onChunk(fullContent);
            streamingSuccessful = true;
          } else {
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

        if (!isNoResponseBodyError) {
          logError("Error in streaming:", streamError);
        }
      }

      if (!streamingSuccessful) {
        try {
          const response = await agent.generate({
            messages: [
              { role: 'user', content }
            ]
          });

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

mastraAgentService.refreshClient();

export default mastraAgentService;