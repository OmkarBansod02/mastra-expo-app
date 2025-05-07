import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Image, ImageSourcePropType } from 'react-native';
import { Text, Surface, Avatar } from 'react-native-paper';
import { Message } from '../services/mastraService';
import theme from '../utils/theme';

interface ChatMessageProps {
  message: Message;
  isThinking?: boolean;
  logoSource?: ImageSourcePropType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isThinking = false, logoSource }) => {
  const isUser = message.role === 'user';
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!isThinking) return;

    const interval = setInterval(() => {
      setDots(prev => prev === '...' ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, [isThinking]);

  const messageContent = isThinking 
    ? `Assistant is thinking${dots}` 
    : message.content;

  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <View style={[
      styles.container,
      isUser ? styles.userContainer : styles.assistantContainer
    ]}>
      {!isUser && logoSource && (
        <View style={styles.logoContainer}>
          <Image 
            source={logoSource}
            style={styles.logo}
          />
        </View>
      )}
      
      <Surface style={[
        styles.messageBubble,
        isUser ? styles.userBubble : styles.assistantBubble,
        isThinking && styles.thinkingBubble
      ]}>
        {isThinking ? (
          <View style={styles.thinkingContainer}>
            <Text style={[styles.messageText, styles.assistantText]}>
              {messageContent}
            </Text>
            <ActivityIndicator 
              size="small" 
              color={theme.colors.accent} 
              style={{ marginLeft: 8 }} 
            />
          </View>
        ) : (
          <Text style={[
            styles.messageText,
            isUser ? styles.userText : styles.assistantText
          ]}>
            {messageContent}
          </Text>
        )}
        
        <Text style={[
          styles.timestamp,
          isUser ? styles.userTimestamp : styles.assistantTimestamp
        ]}>
          {formattedTime}
        </Text>
      </Surface>
      
      {isUser && (
        <Avatar.Icon 
          size={36} 
          icon="account" 
          style={[styles.avatar, { backgroundColor: theme.colors.accentHover }]}
          color={theme.colors.primaryText}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.md,
    maxWidth: '95%',
    alignItems: 'flex-end',
  },
  userContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  assistantContainer: {
    alignSelf: 'flex-start',
  },
  avatar: {
    marginBottom: 4,
    marginHorizontal: 4,
  },
  logoContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 4,
    marginHorizontal: 4,
  },
  logo: {
    width: 36,
    height: 36,
    resizeMode: 'cover',
  },
  messageBubble: {
    padding: theme.spacing.md,
    borderRadius: theme.spacing.md,
    elevation: 0,
    marginHorizontal: theme.spacing.sm,
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: theme.colors.userBubble,
  },
  assistantBubble: {
    backgroundColor: theme.colors.assistantBubble,
  },
  thinkingBubble: {
    backgroundColor: theme.colors.assistantBubble,
    borderColor: theme.colors.accent,
    borderWidth: 1,
  },
  messageText: {
    fontSize: theme.typography.fontSize.md,
    lineHeight: 24,
  },
  userText: {
    color: theme.colors.userText,
  },
  assistantText: {
    color: theme.colors.assistantText,
  },
  timestamp: {
    fontSize: theme.typography.fontSize.xs,
    marginTop: theme.spacing.sm,
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    color: theme.colors.tertiaryText,
  },
  assistantTimestamp: {
    color: theme.colors.tertiaryText,
  },
  thinkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default ChatMessage;
