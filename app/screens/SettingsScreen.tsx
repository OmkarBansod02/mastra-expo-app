import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Appbar, TextInput, Button, Divider, Text, Switch, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { loadMastraConfig, saveMastraConfig, MastraConfig } from '../utils/configStorage';
import mastraAgentService from '../services/assistantService';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  
  const [mastraUrl, setMastraUrl] = useState('');
  const [mastraAgentId, setMastraAgentId] = useState('');
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load current settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const config = await loadMastraConfig();
        setMastraUrl(config.baseUrl);
        setMastraAgentId(config.agentId);
        setLoading(false);
      } catch (error) {
        console.error('Error loading settings:', error);
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  const handleSave = async () => {
    // Validate inputs
    if (!mastraUrl) {
      Alert.alert('Error', 'Mastra Cloud URL is required');
      return;
    }

    if (!mastraAgentId) {
      Alert.alert('Error', 'Mastra Agent ID is required');
      return;
    }

    setSaving(true);
    
    try {
      // Save configuration
      const config: MastraConfig = {
        baseUrl: mastraUrl,
        apiKey: '',  // API key is not used in the current implementation
        agentId: mastraAgentId
      };
      
      await saveMastraConfig(config);
      
      // Refresh the Mastra client with new settings
      await mastraAgentService.refreshClient();
      
      Alert.alert('Success', 'Settings saved successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction color="#FFFFFF" onPress={() => navigation.goBack()} />
        <Appbar.Content title="Settings" titleStyle={styles.headerTitle} />
      </Appbar.Header>
      
      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Mastra AI Agent Configuration</Text>
        <Text style={styles.sectionDescription}>
          Configure your connection to any AI agent deployed on the Mastra Cloud platform.
        </Text>
        
        <TextInput
          label="Mastra Cloud URL"
          value={mastraUrl}
          onChangeText={setMastraUrl}
          mode="outlined"
          style={styles.input}
          placeholder="https://api.mastra.ai"
          autoCapitalize="none"
          keyboardType="url"
        />
        
        <TextInput
          label="Agent ID"
          value={mastraAgentId}
          onChangeText={setMastraAgentId}
          mode="outlined"
          style={styles.input}
          placeholder="Enter Agent ID"
          autoCapitalize="none"
        />
        
        <Divider style={styles.divider} />
        
        <Text style={styles.sectionTitle}>App Settings</Text>
        <View style={styles.settingRow}>
          <Text>Enable Notifications</Text>
          <Switch
            value={enableNotifications}
            onValueChange={setEnableNotifications}
          />
        </View>
        
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={saving}
            style={styles.button}
            buttonColor={theme.colors.primary}
            textColor="#FFFFFF"
          >
            Save Settings
          </Button>
        </View>
        
        <Text style={styles.hint}>
          Enter the Mastra Cloud URL and Agent ID to connect to any AI agent deployed on your Mastra Cloud instance.
          Different agents provide different capabilities (e.g., weather information, financial advice, customer support).
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#2196F3',
    elevation: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 8,
    color: '#333',
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 12,
    color: '#666',
    lineHeight: 20,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  divider: {
    marginVertical: 24,
    height: 1,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  buttonContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  button: {
    width: '100%',
    paddingVertical: 6,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  }
});

export default SettingsScreen;
