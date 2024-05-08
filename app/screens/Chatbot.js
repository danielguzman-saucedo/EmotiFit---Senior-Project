// chatbot
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function Chatbot() {
  const [userInput, setUserInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatting, setIsChatting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const loadChatHistory = async () => {
      const storedMessages = await AsyncStorage.getItem('chatMessages');
      if (storedMessages) {
        setChatMessages(JSON.parse(storedMessages));
      }
    };
    loadChatHistory();
  }, []);

  useEffect(() => {
    const saveChatHistory = async () => {
      await AsyncStorage.setItem('chatMessages', JSON.stringify(chatMessages));
    };
    saveChatHistory();
  }, [chatMessages]);

  const sendChatMessage = async () => {
    const userMessage = userInput.trim();
    if (userMessage === '') return;

    const newMessage = { role: 'user', content: userMessage };
    setChatMessages((prevMessages) => [...prevMessages, newMessage]);
    setUserInput('');
    setIsChatting(true);

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: chatMessages.concat(newMessage),
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer your_api_key_here`, // Use environment variable or secure storage
          },
        }
      );

      const assistantResponse = response.data.choices[0].message.content;
      setChatMessages((prevMessages) => [
        ...prevMessages,
        { role: 'assistant', content: assistantResponse },
      ]);
      setIsChatting(false);
    } catch (error) {
      console.error(
        'Error sending message:',
        error.response?.data || error.message
      );
      setIsChatting(false);
    }
  };

  const clearHistory = async () => {
    await AsyncStorage.removeItem('chatMessages');
    setChatMessages([]);
  };

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.chatContainer}>
        {chatMessages.map((message, index) => (
          <View
            key={index}
            style={
              message.role === 'user' ? styles.userBubble : styles.assistantBubble
            }>
            <Text style={styles.chatText}>{message.content}</Text>
          </View>
        ))}
        {isChatting && (
          <View style={styles.typingIndicator}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.typingText}>Generating response...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Ask the assistant anything..."
          placeholderTextColor="#9eadba"
          style={styles.input}
          value={userInput}
          onChangeText={setUserInput}
        />
        <TouchableOpacity onPress={sendChatMessage}>
          <View style={styles.sendButton}>
            <Text style={styles.sendButtonText}>Send</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={clearHistory}>
          <View style={styles.clearButton}>
            <Text style={styles.sendButtonText}>Clear History</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleDropdown}>
          <View style={styles.dropdownButton}>
            <Text style={styles.sendButtonText}>Dropdown</Text>
          </View>
        </TouchableOpacity>
      </View>

      {isDropdownOpen && (
        <View style={styles.dropdownMenu}>
          <TouchableOpacity onPress={() => alert('Option 1')}>
            <Text style={styles.dropdownItem}>Option 1</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => alert('Option 2')}>
            <Text style={styles.dropdownItem}>Option 2</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#f0f0f0',
  },
  chatContainer: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  assistantBubble: {
    backgroundColor: '#9eadba',
    alignSelf: 'flex-start',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  chatText: {
    color: '#ffffff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 10,
  },
  input: {
    flex: 1,
    marginRight: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#cccccc',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginHorizontal: 5,
  },
  clearButton: {
    backgroundColor: '#ff3b30',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginHorizontal: 5,
  },
  dropdownButton: {
    backgroundColor: '#34c759',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginHorizontal: 5,
  },
  sendButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 20,
    marginBottom: 10,
  },
  typingText: {
    marginLeft: 10,
    color: '#555555',
    fontStyle: 'italic',
  },
  dropdownMenu: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 10,
    position: 'absolute',
    bottom: 80,
    left: 10,
    right: 10,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
  },
});
