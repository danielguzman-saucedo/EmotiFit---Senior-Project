import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Udp from 'react-native-udp';

interface RemoteInfo {
  address: string;
  port: number;
  HR?: number; //HR Field
}

const App = () => {
  const [udpMessage, setUdpMessage] = useState('');
  const [bgColor, setBgColor] = useState('transparent');
  const udpPort = 12346;
  const backendUrl = 'http://localhost:5000/api/data';

  //UDP Message
  const handleUdpMessage = (msg: Buffer, rinfo: RemoteInfo) => {
    const messageString = msg.toString();

    const messageParts = messageString.split(',');
    if (messageParts.length >= 3 && messageParts[3] === 'HR') {
      const sixthValue = parseInt(messageParts[6]);
      console.log('Heart Rate:', sixthValue);
      setUdpMessage(`Heart Rate: ${sixthValue}`);

      //Color changeeeeeee
      if (sixthValue > 90) {
        setBgColor('red');
      } else if (sixthValue < 60) {
        setBgColor('blue');
      } else {
        setBgColor('transparent'); //Normal color
      }

      //Send data to backend server
      sendDataToBackend({ heartRate: sixthValue });
    } else {
      console.log('Ignoring');
    }
  };

  const sendDataToBackend = async (data: { heartRate: number }) => {
    try {
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        console.log('Data sent to backend successfully');
      } else {
        console.error('Failed to send data to backend');
      }
    } catch (error) {
      console.error('Error sending data to backend:', error);
    }
  };

  useEffect(() => {
    const udpSocket = Udp.createSocket({
      type: 'udp4', //UDP type
    });

    udpSocket.bind(udpPort);

    udpSocket.on('message', handleUdpMessage);

    return () => {
      udpSocket.off('message', handleUdpMessage); //UDP Socket off
      udpSocket.close();
    };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Text style={styles.message}>{udpMessage}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 22,
  },
});

export default App;
