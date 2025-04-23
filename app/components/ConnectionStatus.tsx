import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import theme from '../utils/theme';

interface ConnectionStatusProps {
  isConnected: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ isConnected }) => {
  return (
    <View style={styles.container}>
      <Chip
        icon={isConnected ? "check-circle" : "close-circle"}
        mode="outlined"
        style={[
          styles.chip,
          { 
            borderColor: isConnected ? theme.colors.success : theme.colors.error,
            backgroundColor: isConnected 
              ? 'rgba(16, 163, 127, 0.1)' // Success with transparency
              : 'rgba(239, 68, 68, 0.1)'  // Error with transparency
          }
        ]}
        textStyle={{ 
          color: isConnected ? theme.colors.success : theme.colors.error,
          fontWeight: '500'
        }}
      >
        {isConnected ? 'Connected' : 'Disconnected'}
      </Chip>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
  },
  chip: {
    height: 32,
  },
});

export default ConnectionStatus;
