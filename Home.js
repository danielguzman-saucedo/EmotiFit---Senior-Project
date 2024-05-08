import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, TextInput, Image } from 'react-native';
import Udp from 'react-native-udp';
import auth from '@react-native-firebase/auth';



const HomeScreen = ({ navigation }) => {

  //UDP CODE DEVELOPED BY PAMELLA NIPAY
  const [udpMessage, setUdpMessage] = useState('');
  const [bgColor, setBgColor] = useState('transparent');
  const [age, setAge] = useState('');
  const [ageEntered, setAgeEntered] = useState(false);
  const [heartRates, setHeartRates] = useState([]);
  const udpPort = 12346;

  const handleUdpMessage = (msg, rinfo) => {
    const messageString = msg.toString();
    const messageParts = messageString.split(',');

    if (messageParts.length >= 3 && messageParts[3] === 'HR') {
      const sixthValue = parseInt(messageParts[6]);
      console.log('Heart Rate:', sixthValue);
      setUdpMessage(`Heart Rate: ${sixthValue}`);
      setHeartRates(currentRates => [...currentRates, sixthValue]);
    } else {
      console.log('Ignoring');
    }
  };

  useEffect(() => {
    if (!ageEntered) return;

    const udpSocket = Udp.createSocket({type: 'udp4'});
    udpSocket.bind(udpPort);
    udpSocket.on('message', handleUdpMessage);

    const interval = setInterval(() => {
      if (heartRates.length > 0) {
        const average = heartRates.reduce((acc, rate) => acc + rate, 0) / heartRates.length;
        const maxHeartRate = 220 - parseInt(age);
        const aerobicLowerBound = maxHeartRate * 0.60;
        const aerobicUpperBound = maxHeartRate * 0.80;
        const anaerobicLowerBound = maxHeartRate * 0.81;
        const anaerobicUpperBound = maxHeartRate * 0.90;

        if (average >= aerobicLowerBound && average <= aerobicUpperBound) {
          setBgColor('blue');
        } else if (average >= anaerobicLowerBound && average <= anaerobicUpperBound) {
          setBgColor('red');
        } else {
          setBgColor('transparent');
        }

        setHeartRates([]);
      }
    }, 10000);

    return () => {
      udpSocket.off('message', handleUdpMessage);
      udpSocket.close();
      clearInterval(interval);
    };
  }, [ageEntered, age, heartRates]);

return (

<SafeAreaView style={styles.container}>
    <ScrollView>
      <View style={styles.top}>
      <Image alt="" resizeMode="contain" style={styles.headerImg} source={require("../assets/icon.png")} />
        <View style={styles.header}>
        </View>
        <View style={styles.welcome}>
            <Text style={styles.welcomeTitle}>Hello, <Text style={styles.welcomeName}>{auth().currentUser?.displayName}</Text>!</Text>
            <Text style={styles.welcomeText}>Let's get a workout in today!</Text>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.contentHeader}>
          <Text style={styles.contentTitle}>Workouts</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Workouts')
            }>
            <Text style={styles.contentLink}>See all</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
          <View style={styles.contentHeader}>
            <Text style={styles.contentTitle}>EmotiBit Connection</Text>
            {!ageEntered && (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your age"
                  keyboardType="numeric"
                  onChangeText={setAge}
                  value={age}
                />
                <Button title="Enter Age" onPress={() => setAgeEntered(true)} />
              </View>
            )}
            <Text style={[styles.heartRateText, { backgroundColor: bgColor }]}>{udpMessage}</Text>
          </View>
        </View>

      <View style={styles.content}>
        <View style={styles.contentHeader}>
          <Text style={styles.contentTitle}>Want to talk to your personal AI trainer?</Text>
        </View>
        <View style={styles.contentHeader}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Chatbot')
            }>
            <Text style={styles.contentLink}>Spark a conversation here!</Text>
          </TouchableOpacity></View>
      </View>

      <View style={styles.content}>
        <View style={styles.contentHeader}>
          <Text style={styles.contentTitle}>Want your recommended music based on BPM?</Text>
        </View>
        <View style={styles.contentHeader}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Music')
            }>
            <Text style={styles.contentLink}>Sign in to Spotify here!</Text>
          </TouchableOpacity></View>
      </View>
      </ScrollView>
      

      <View style={styles.bottomNav}>
        <TouchableOpacity 
        style={styles.navItem}
        onPress={() => navigation.navigate('Home')}
        >
            <Text>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
        style={styles.navItem}
        onPress={() => navigation.navigate('Music')}
        >
            <Text>Music</Text>
        </TouchableOpacity>

        <TouchableOpacity 
        style={styles.navItem}
        onPress={() => navigation.navigate('Chatbot')}
        >
            <Text>Chatbot</Text>
        </TouchableOpacity>

        <TouchableOpacity 
        style={styles.navItem}
        onPress={() => navigation.navigate('Workouts')}
        >
            <Text>Workouts</Text>
        </TouchableOpacity>

        <TouchableOpacity 
        style={styles.navItem}
        onPress={() => navigation.navigate('Profile')}
        >
            <Text>Profile</Text>
        </TouchableOpacity>
    </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  topBar: {
    width: '100%',
    backgroundColor: '#3498db',
    paddingVertical: 30,
    alignItems: 'center',
    bottom: 340,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    alignContent: 'center',
    color: 'white',
    top: 15,
    right: 4,
  },
  text: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  userWelcome: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  editProfileButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    padding: 5,
    backgroundColor: 'white',
    borderRadius: 5,
  },
  workoutDataButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    padding: 5,
    backgroundColor: 'white',
    borderRadius: 5,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    paddingVertical: 25,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
},
navItem: {
    
    alignItems: 'center',
    bottom: 10
},
container: {
  backgroundColor: '#ffffff',
  flex: 1,
},
top: {
  paddingHorizontal: 24,
  paddingVertical: 8,
},
header: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
},
avatar: {
  width: 48,
  height: 48,
  borderRadius: 9999,
},
welcome: {
  paddingVertical: 16,
  borderBottomWidth: 1,
  borderBottomColor: 'rgba(255,255,255,0.15)',
  marginBottom: 12,
},
welcomeTitle: {
  fontSize: 28,
  fontWeight: '800',
  color: '#1a2525',
},
welcomeName:{
  fontSize: 25,
  fontWeight: '800',
  color: '#0884af'
},
welcomeText: {
  fontSize: 16,
  fontWeight: '500',
  color: '#1a2525',
  marginTop: 8,
},
search: {
  position: 'relative',
},
searchInput: {
  height: 56,
  backgroundColor: '#f3f3f6',
  paddingHorizontal: 16,
  color: '#1a2525',
  fontSize: 18,
  borderRadius: 9999,
},
searchFloating: {
  position: 'absolute',
  top: 0,
  right: 0,
  height: '100%',
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 8,
},
searchButton: {
  alignSelf: 'flex-end',
  width: 55,
  height: 55,
  borderRadius: 9999,
  backgroundColor: '#0884af',
  justifyContent: 'center',
  alignItems: 'center',
  top: -56,
},
content: {
  paddingVertical: 8,
  paddingHorizontal: 22,
  flex: 1,
},
contentHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: 12,
},
contentTitle: {
  fontSize: 22,
  fontWeight: '800',
  color: '#1a2525',
},
contentLink: {
  fontSize: 16,
  fontWeight: '700',
  color: '#0884af',
},
contentPlaceholder: {
  borderStyle: 'dashed',
  borderWidth: 4,
  borderColor: '#e5e7eb',
  flex: 1,
  borderRadius: 8,
},
  /** Card */
  card: {
    paddingVertical: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  cardEmoji: {
    width: 50,
    height: 50,
    borderRadius: 9999,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  cardInfo: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardInfoItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  cardInfoItemText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#636a73',
    marginLeft: 2,
  },
  cardAction: {
    marginLeft: 'auto',
  },
  heartRateText: {
    fontSize: 18,
    marginTop: 10,
    padding: 10,
    color: '#fff',
  },
  headerImg: {
    backgroundColor: '#777777',
    margin: 10,

    alignSelf: 'center',
    height: 100,
    marginBottom: 3,
    width: 100,
  },
});

export default HomeScreen;