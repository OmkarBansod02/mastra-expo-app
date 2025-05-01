import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, IconButton } from 'react-native-paper';
import theme from '../utils/theme';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading = false }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.container}>
        <TextInput
          mode="outlined"
          placeholder="Message the agent..."
          value={message}
          onChangeText={setMessage}
          style={styles.input}
          multiline
          maxLength={1000}
          disabled={isLoading}
          outlineStyle={styles.outlineStyle}
          outlineColor={theme.colors.border}
          activeOutlineColor={theme.colors.accent}
          placeholderTextColor={theme.colors.tertiaryText}
          textColor={theme.colors.primaryText}
          theme={{ colors: { background: theme.colors.inputBackground } }}
          dense
        />
        <IconButton
          icon="send"
          mode="contained"
          iconColor={theme.colors.primaryText}
          style={[
            styles.sendButton,
            { 
              opacity: !message.trim() || isLoading ? 0.5 : 1,
              backgroundColor: message.trim() && !isLoading 
                ? theme.colors.accent 
                : theme.colors.accentHover 
            }
          ]}
          size={24}
          onPress={handleSend}
          disabled={!message.trim() || isLoading}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: theme.colors.inputBackground,
    marginRight: theme.spacing.md,
  },
  outlineStyle: {
    borderRadius: 16,
    borderColor: theme.colors.border,
  },
  sendButton: {
    borderRadius: 50,
    margin: 0,
    width: 40,
    height: 40,
  },
});

export default ChatInput;
