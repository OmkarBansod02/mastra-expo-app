import { MastraClient } from '@mastra/client-js';
import { log, logError } from '../utils/config';
import { loadMastraConfig } from '../utils/configStorage';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

const mastraAgentService = {
  client: null as any,
  agent: null as any,
  connected: false,
  
  async refreshClient() {
    try {
      const config = await loadMastraConfig();
      
      if (!config.baseUrl || !config.agentId) {
        this.connected = false;
        return false;
      }
      
      this.client = new MastraClient({
        baseUrl: config.baseUrl,
      });
      
      this.agent = this.client.getAgent(config.agentId);
      this.connected = true;
      return true;
    } catch (error) {
      logError("Error initializing Mastra client:", error);
      this.client = null;
      this.agent = null;
      this.connected = false;
      return false;
    }
  },
  
  async ensureInitialized() {
    if (!this.client || !this.agent) {
      return await this.refreshClient();
    }
    return true;
  },
  
  isConfigured() {
    return this.connected;
  },
  
  async sendMessage(content: string): Promise<Message> {
    try {
      if (!await this.ensureInitialized()) {
        throw new Error("Mastra client not properly configured");
      }
      
      const response = await this.agent.generate({
        messages: [
          { role: 'user', content }
        ]
      });
      
      const responseText = typeof response === 'string' 
        ? response 
        : (response as any).text || JSON.stringify(response);
      
      return this.formatMessage('assistant', responseText);
    } catch (error) {
      logError('Error sending message:', error);
      return this.formatMessage('assistant', "Sorry, I couldn't process your request. Please try again.");
    }
  },

  async streamMessage(content: string, onChunk: (chunk: string) => void): Promise<Message> {
    try {
      if (!await this.ensureInitialized()) {
        throw new Error("Mastra client not properly configured");
      }
      
      let fullContent = '';
      let streamingSuccessful = false;

      try {
        const streamResponse = await this.agent.stream({
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

      // Fall back to non-streaming if streaming failed
      if (!streamingSuccessful) {
        try {
          const response = await this.agent.generate({
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

      return this.formatMessage('assistant', fullContent);
    } catch (error) {
      logError('Error handling message:', error);
      const errorMessage = "Sorry, I couldn't process your request. Please try again.";
      onChunk(errorMessage);
      return this.formatMessage('assistant', errorMessage);
    }
  },
  
  formatMessage(role: 'user' | 'assistant', content: string): Message {
    return {
      id: Date.now().toString(),
      content,
      role,
      timestamp: new Date(),
    };
  },
  
  async testConnection(): Promise<boolean> {
    try {
      if (!await this.ensureInitialized()) {
        return false;
      }

      // Send a simple test message
      await this.agent.generate({
        messages: [{ role: "user", content: "Test connection" }]
      });
      
      this.connected = true;
      return true;
    } catch (error) {
      this.connected = false;
      return false;
    }
  }
};

// Initialize on import
mastraAgentService.refreshClient();

export default mastraAgentService;