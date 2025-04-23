import { MastraClient } from '@mastra/client-js';
import { personalAssistantUrl, mastraAgentId, log, logError } from '../utils/config';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const client = new MastraClient({
  baseUrl: personalAssistantUrl,
});

const agent = client.getAgent(mastraAgentId);

const weatherAgentService = {
  isConfigured: () => !!agent,

  sendMessage: async (content: string): Promise<Message> => {
    try {
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

export default weatherAgentService;