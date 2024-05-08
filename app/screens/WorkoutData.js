// spotify 
import React, { useEffect, useState } from "react";
import { Image, View, Text, TextInput, Button, Alert, ScrollView, StyleSheet } from "react-native";
import { useAuthRequest, ResponseType } from "expo-auth-session";
import { WebView } from 'react-native-webview';

const discovery = {
    authorizationEndpoint: "https://accounts.spotify.com/authorize",
    tokenEndpoint: "https://accounts.spotify.com/api/token",
};

const WorkoutData = () => {
    const [request, response, promptAsync] = useAuthRequest(
        {
            responseType: ResponseType.Token,
            clientId: '30198eecba5b46c989f757e00ef17090', // Replace with your Spotify Client ID
            scopes: ['user-read-private', 'user-top-read', 'user-library-read'], // Make sure these scopes are correct
            usePKCE: false,
            redirectUri: "emotifit://callback", // Replace with your redirect URI
        },
        discovery
    );

    const [topTracks, setTopTracks] = useState([]);
    const [topArtists, setTopArtists] = useState([]);
    const [averageTempo, setAverageTempo] = useState(0);
    const [recommendedBPM, setRecommendedBPM] = useState('');
    const [filteredTracks, setFilteredTracks] = useState([]);
    const [loggedIn, setLoggedIn] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [showRecommendations, setShowRecommendations] = useState(false);
    const [filterCount, setFilterCount] = useState(0);

    useEffect(() => {
        if (response?.type === "success") {
            const { access_token } = response.params;
            Alert.alert("Login Success", `Access token: ${access_token}`);
            setLoggedIn(true);
            fetchUserData(access_token);
        } else if (response?.type === "error") {
            const { error } = response.params;
            Alert.alert("Authentication Error", `Error: ${error}`);
        }
    }, [response]);

    const fetchUserData = (accessToken) => {
        fetchTopTracks(accessToken);
        fetchTopArtists(accessToken);
    };

    const fetchTopTracks = (accessToken) => {
        fetch('https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=long_term', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        })
            .then(response => {
                if (response.status === 403) {
                    throw new Error('Permission denied. Check your API scopes and permissions.');
                }
                return response.json();
            })
            .then(data => {
                setTopTracks(data.items);
                const trackIds = data.items.map(track => track.id).join(",");
                fetchAudioFeatures(accessToken, trackIds);
            })
            .catch(error => {
                console.error('Error fetching top tracks:', error);
                Alert.alert('Error fetching top tracks', error.message);
            });
    };

    const fetchTopArtists = (accessToken) => {
        fetch('https://api.spotify.com/v1/me/top/artists?limit=10&time_range=long_term', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        })
            .then(response => {
                if (response.status === 403) {
                    throw new Error('Permission denied. Check your API scopes and permissions.');
                }
                return response.json();
            })
            .then(data => {
                setTopArtists(data.items);
            })
            .catch(error => {
                console.error('Error fetching top artists:', error);
                Alert.alert('Error fetching top artists', error.message);
            });
    };

    const fetchAudioFeatures = async (accessToken, trackIds) => {
        try {
            const response = await fetch(`https://api.spotify.com/v1/audio-features?ids=${trackIds}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (response.status === 403) {
                throw new Error('Permission denied. Check your API scopes and permissions.');
            }

            const data = await response.json();

            if (Array.isArray(data.audio_features)) {
                const tempos = data.audio_features.map(feature => feature.tempo);
                const average = tempos.reduce((acc, curr) => acc + curr, 0) / tempos.length;
                setAverageTempo(Math.round(average));
            } else {
                console.error('Invalid or empty audio features:', data);
                Alert.alert('No audio features found for the provided tracks.');
            }
        } catch (error) {
            console.error('Error fetching audio features:', error);
            Alert.alert('Error fetching audio features', error.message);
        }
    };

    const fetchFilteredTracks = async (accessToken, desiredBPM) => {
        if (isNaN(desiredBPM) || desiredBPM <= 0) {
            Alert.alert('Invalid BPM', 'Please enter a valid BPM value.');
            return;
        }

        try {
            const response = await fetch(`https://api.spotify.com/v1/me/tracks?limit=50`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (response.status === 403) {
                throw new Error('Permission denied. Check your API scopes and permissions.');
            }

            const data = await response.json();

            if (data.items && data.items.length > 0) {
                const trackIds = data.items.map(item => item.track.id).join(',');

                // Fetch the audio features for these track IDs
                await fetchAudioFeatures(accessToken, trackIds);

                const tracksWithAudioFeatures = data.items.map(item => {
                    const audioFeature = data.audio_features?.find(feature => feature.id === item.track.id);
                    return {
                        ...item,
                        track: {
                            ...item.track,
                            audioFeature: audioFeature
                        }
                    };
                });

                const sortedTracks = tracksWithAudioFeatures
                    .filter(track => track.track.audioFeature)
                    .sort((a, b) => {
                        const diffA = Math.abs(a.track.audioFeature.tempo - desiredBPM);
                        const diffB = Math.abs(b.track.audioFeature.tempo - desiredBPM);
                        return diffA - diffB;
                    });

                const nextTracks = sortedTracks.slice(filterCount * 5, (filterCount + 1) * 5);

                if (nextTracks.length > 0) {
                    setFilteredTracks(nextTracks);
                    setFilterCount(filterCount + 1);
                } else {
                    Alert.alert("No more songs", "There are no more songs to display at this BPM range.");
                    setFilterCount(0); // Reset the filter count
                }
            } else {
                Alert.alert('No liked tracks available.');
            }
        } catch (error) {
            console.error('Error fetching liked songs:', error);
            Alert.alert('Error fetching liked songs', error.message);
        }
    };

    const logout = () => {
        setLoggedIn(false);
        setShowStats(false);
        setShowRecommendations(false);
        setFilteredTracks([]);
        setTopTracks([]);
        setTopArtists([]);
    };

    return (
        <View style={styles.container}>
            {loggedIn ? (
                <>
                    <Text style={styles.loggedInText}>Logged in to Spotify</Text>
                    <Button
                        title={showStats ? "Hide Stats" : "Show Stats"}
                        onPress={() => {
                            setShowStats(!showStats);
                            if (showRecommendations) {
                                setShowRecommendations(false);
                            }
                        }}
                    />
                    <Button
                        title={showRecommendations ? "Hide Recommendations" : "Show Recommendations"}
                        onPress={() => {
                            setShowRecommendations(!showRecommendations);
                            if (showStats) {
                                setShowStats(false);
                            }
                        }}
                    />
                    {showStats && (
                        <ScrollView style={styles.scrollContainer}>
                            <Text style={styles.header}>Top Tracks:</Text>
                            {topTracks.map((track, index) => (
                                <Text key={index} style={styles.smallText}>
                                    {`${index + 1}. ${track.name} by ${track.artists.map(artist => artist.name).join(", ")}`}
                                </Text>
                            ))}
                            <Text style={styles.header}>Top Artists:</Text>
                            {topArtists.map((artist, index) => (
                                <Text key={index} style={styles.smallText}>
                                    {`${index + 1}. ${artist.name}`}
                                </Text>
                            ))}
                            <Text style={styles.header}>Average Tempo:</Text>
                            <Text style={styles.smallText}>{averageTempo} BPM</Text>
                        </ScrollView>
                    )}
                    {showRecommendations && (
                        <>
                            <ScrollView style={styles.scrollContainer}>
                                <Text style={styles.header}>Tracks Matching Your BPM:</Text>
                                {filteredTracks.map((track, index) => (
                                    <View key={index} style={styles.trackContainer}>
                                        <Image
                                            source={{ uri: track.track.album.images[0].url }}
                                            style={styles.albumArtwork}
                                        />
                                        <Text style={styles.smallText}>
                                            {`${track.track.name} by ${track.track.artists.map(artist => artist.name).join(", ")} (BPM: ${track.track.audioFeature.tempo.toFixed(2)})`}
                                        </Text>
                                    </View>
                                ))}
                            </ScrollView>
                            <View style={styles.filterContainer}>
                                <TextInput
                                    style={styles.input}
                                    onChangeText={setRecommendedBPM}
                                    value={recommendedBPM}
                                    placeholder="Enter desired BPM"
                                    keyboardType="numeric"
                                />
                                <Button
                                    title="Filter Tracks"
                                    onPress={() => fetchFilteredTracks(response.params.access_token, parseFloat(recommendedBPM))}
                                />
                            </View>
                        </>
                    )}
                    <Button
                        title="Logout"
                        onPress={logout}
                    />
                </>
            ) : (
                <Button
                    title="Login to Spotify"
                    onPress={() => promptAsync()}
                />
            )}
            {!showStats && !showRecommendations && (
                <WebView
                    style={styles.webview}
                    source={{ uri: 'https://www.spotify.com' }}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    webview: {
        marginTop: 10,
        width: '80%',
        aspectRatio: 0.50,
    },
    scrollContainer: {
        width: '100%',
        padding: 10,
    },
    header: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
    },
    albumArtwork: {
        width: 50,
        height: 50
    },
    filterContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white', // Change as per theme
        padding: 20
    },
    input: {
        height: 40,
        marginBottom: 12,
        borderWidth: 1,
        padding: 10,
        borderRadius: 4,
    },
    trackContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 5
    },
    smallText: {
        fontSize: 14,
        marginVertical: 5,
    },
    loggedInText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },
});

export default WorkoutData;
