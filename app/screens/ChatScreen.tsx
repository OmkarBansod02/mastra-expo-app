import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, SafeAreaView, StatusBar, Image } from 'react-native';
import { Appbar, Text, Divider, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import mastraAgentService, { Message } from '../services/mastraService';
import theme from '../utils/theme';

const mastraLogo = require('../../assets/mastra-logo.jpeg');

const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const navigation = useNavigation();

  // Check connection status and refresh it when component mounts or comes into focus
  useEffect(() => {
    const checkConnection = async () => {
      await mastraAgentService.refreshClient();
      const isConfigured = mastraAgentService.isConfigured();
      setIsConnected(isConfigured);

      const initialMessage: Message = {
        id: '0',
        role: 'assistant',
        content: isConfigured 
          ? 'Hello! I\'m your Mastra AI assistant. How can I help you today?'
          : 'The app is not properly configured. Please tap the settings icon in the top-right corner to configure your Mastra Cloud URL and Agent ID.',
        timestamp: new Date(),
      };
      
      setMessages([initialMessage]);
    };
    
    checkConnection();
    
    // Set up a listener for when the screen is focused (coming back from settings)
    const unsubscribe = navigation.addListener('focus', () => {
      checkConnection();
    });
    
    return unsubscribe;
  }, [navigation]);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    setIsLoading(true);
    
    const assistantMessageId = Date.now() + 1000;
    const placeholderMessage: Message = {
      id: assistantMessageId.toString(),
      role: 'assistant',
      content: 'Assistant is thinking...',
      timestamp: new Date(),
    };
    
    setMessages(prevMessages => [...prevMessages, placeholderMessage]);
    
    try {
      let hasReceivedContent = false;
      
      await mastraAgentService.streamMessage(
        content, 
        (chunk) => {
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.id === assistantMessageId.toString()
                ? { 
                    ...msg, 
                    content: hasReceivedContent 
                      ? msg.content + chunk 
                      : chunk
                  }
                : msg
            )
          );
          
          hasReceivedContent = true;
          flatListRef.current?.scrollToEnd({ animated: true });
        }
      );
      
      setIsConnected(true);
    } catch (error) {
      console.error('Error getting response:', error);
      setIsConnected(false);
      
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === assistantMessageId.toString()
            ? { 
                ...msg, 
                content: 'Sorry, I encountered an error. Please check your connection settings and try again.' 
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToSettings = () => {
    navigation.navigate('Settings' as never);
  };

  const getMessageDate = (timestamp: Date) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderMessageOrDateHeader = ({ item, index }: { item: Message, index: number }) => {
    const currentDate = getMessageDate(item.timestamp);
    const showDateHeader = index === 0 || 
      getMessageDate(messages[index - 1].timestamp) !== currentDate;
    
    const isThinking = item.role === 'assistant' && 
                      item.content === 'Assistant is thinking...';
    
    return (
      <>
        {showDateHeader && (
          <View style={styles.dateHeaderContainer}>
            <Divider style={styles.divider} />
            <Text style={styles.dateHeader}>{currentDate}</Text>
            <Divider style={styles.divider} />
          </View>
        )}
        <ChatMessage 
          message={item} 
          isThinking={isThinking}
          logoSource={mastraLogo}
        />
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={theme.colors.background} barStyle="light-content" />
      <View style={styles.container}>
        <Appbar.Header style={styles.header}>
          <View style={styles.headerLogoContainer}>
            <Image 
              source={mastraLogo}
              style={styles.headerLogo}
            />
          </View>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Mastra AI Agent</Text>
            <Text style={[
              styles.connectionStatus,
              isConnected ? styles.connectedStatus : styles.disconnectedStatus
            ]}>
              {isConnected ? 'Online' : 'Offline'}
            </Text>
          </View>
          
          <IconButton
            icon="cog"
            iconColor={theme.colors.primaryText}
            size={24}
            onPress={navigateToSettings}
            style={styles.settingsButton}
          />
        </Appbar.Header>
        
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageOrDateHeader}
          contentContainerStyle={styles.messagesList}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          style={styles.flatList}
        />
        
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.background,
    elevation: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  headerLogoContainer: {
    marginRight: theme.spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: theme.colors.background,
  },
  headerLogo: {
    width: 40,
    height: 40,
    resizeMode: 'cover',
  },
  headerTitleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    color: theme.colors.primaryText,
    fontWeight: 'bold',
    fontSize: 18,
  },
  connectionStatus: {
    fontSize: 12,
  },
  connectedStatus: {
    color: theme.colors.success,
  },
  disconnectedStatus: {
    color: theme.colors.error,
  },
  settingsButton: {
    margin: 0,
  },
  flatList: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  messagesList: {
    padding: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
  dateHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  dateHeader: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.tertiaryText,
    marginHorizontal: theme.spacing.sm,
  },
  divider: {
    flex: 1,
    backgroundColor: theme.colors.divider,
  },
});

export default ChatScreen;
