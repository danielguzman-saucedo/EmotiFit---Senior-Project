import React, { useState } from 'react';
import { SafeAreaView, Button, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

const App = () => {
  const [fileUris, setFileUris] = useState<string[]>([]);

  const handleImportFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/csv',
        copyToCacheDirectory: true, // Ensure file is copied to cache directory
        multiple: true, // Allow multiple file selection
      });

      if (!result.canceled && result.assets) {
        const uris = result.assets.map(asset => asset.uri);
        setFileUris(uris);
        console.log('File URIs:', uris);

        // You can process each file URI individually here
        for (const uri of uris) {
          const fileContent = await FileSystem.readAsStringAsync(uri);
          console.log('File content:', fileContent);
        }
      } else {
        console.log('File picking cancelled');
      }
    } catch (error) {
      console.error('Error picking files:', error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button title="Import Files" onPress={handleImportFile} />
      {fileUris.length > 0 && (
        <View style={{ marginTop: 20, alignItems: 'center' }}>
          <Text>File URIs:</Text>
          {fileUris.map((uri, index) => (
            <Text key={index}>{uri}</Text>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
};

export default App;
