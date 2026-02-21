import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, Image, Text, StatusBar, Modal, Alert } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import Slider from '@react-native-community/slider'; // Ensure this is installed
import axios from "axios";
import Constants from "expo-constants";

import HomeScreen from "./src/screens/HomeScreen";
import SearchScreen from "./src/screens/SearchScreen";
import UploadScreen from "./src/screens/UploadScreen";

export type RootTabParamList = { Home: undefined; Search: undefined; Upload: undefined; };
const Tab = createBottomTabNavigator<RootTabParamList>();

const hostUri = Constants.expoConfig?.hostUri;
const localIp = hostUri ? hostUri.split(":")[0] : "localhost";
const API_URL = `http://${localIp}:5000/api/songs`;

export default function App() {
  const [songs, setSongs] = useState<any[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [currentSong, setCurrentSong] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullPlayerVisible, setIsFullPlayerVisible] = useState(false);
  const [isSliding, setIsSliding] = useState(false);

  // --- PROGRESS STATE ---
  const [progress, setProgress] = useState(0); 
  const [position, setPosition] = useState(0); 
  const [duration, setDuration] = useState(0); 

  const fetchSongs = async () => {
    try {
      const res = await axios.get(API_URL);
      setSongs(res.data.data);
    } catch (e: any) { console.error("Fetch failed:", e.message); }
  };

  useEffect(() => {
    fetchSongs();
    return () => { if (sound) sound.unloadAsync(); };
  }, []);

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      // Don't update progress while the user is manually sliding
      if (!isSliding) {
        const p = status.positionMillis / (status.durationMillis || 1);
        setProgress(p || 0);
        setPosition(status.positionMillis);
        setDuration(status.durationMillis || 0);
      }
      setIsPlaying(status.isPlaying);
      if (status.didJustFinish) skipTrack('next');
    }
  };

  const playSong = useCallback(async (song: any) => {
    try {
      if (sound) await sound.unloadAsync();
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: song.audio_url },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
      setCurrentSong(song);
    } catch (error) { console.error("Playback Error:", error); }
  }, [sound, songs, isSliding]);

  const togglePlayPause = async () => {
    if (!sound) return;
    isPlaying ? await sound.pauseAsync() : await sound.playAsync();
  };

  const skipTrack = (direction: 'next' | 'prev') => {
    const currentIndex = songs.findIndex(s => s.id === currentSong?.id);
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    if (nextIndex >= songs.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = songs.length - 1;

    playSong(songs[nextIndex]);
  };

  const onSeek = async (value: number) => {
    if (sound) {
      const seekPosition = value * duration;
      await sound.setPositionAsync(seekPosition);
    }
  };

  const formatTime = (millis: number) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar barStyle="light-content" />
      <NavigationContainer>
        <Tab.Navigator
          id="main-tabs"
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: styles.tabBar,
            tabBarActiveTintColor: "#8A2BE2",
            tabBarIcon: ({ color, size }) => {
              let iconName: any = route.name === "Home" ? "home" : route.name === "Search" ? "search" : "cloud-upload";
              return <Ionicons name={iconName} size={size} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Home">{() => <HomeScreen songs={songs} onPlay={playSong} currentSongId={currentSong?.id} />}</Tab.Screen>
          <Tab.Screen name="Search">{() => <SearchScreen songs={songs} onPlay={playSong} />}</Tab.Screen>
          <Tab.Screen name="Upload">{() => <UploadScreen apiUrl={API_URL} onUploadSuccess={fetchSongs} />}</Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>

      {currentSong && !isFullPlayerVisible && (
        <TouchableOpacity style={styles.miniPlayer} onPress={() => setIsFullPlayerVisible(true)}>
          <Image source={{ uri: currentSong.cover_image_url }} style={styles.miniCover} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.miniTitle} numberOfLines={1}>{currentSong.title}</Text>
            <Text style={styles.miniArtist}>{currentSong.artist}</Text>
          </View>
          <TouchableOpacity onPress={togglePlayPause}>
            <Ionicons name={isPlaying ? "pause" : "play"} size={28} color="#FFF" />
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      <Modal visible={isFullPlayerVisible} animationType="slide">
        <View style={styles.fullPlayer}>
          <TouchableOpacity onPress={() => setIsFullPlayerVisible(false)} style={styles.closeBtn}>
            <Ionicons name="chevron-down" size={40} color="#FFF" />
          </TouchableOpacity>
          
          <Image source={{ uri: currentSong?.cover_image_url }} style={styles.fullCover} />
          <Text style={styles.fullTitle}>{currentSong?.title}</Text>
          <Text style={styles.fullArtist}>{currentSong?.artist}</Text>

          {/* INTERACTIVE SEEK BAR */}
          <View style={styles.progressContainer}>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={0}
              maximumValue={1}
              value={progress}
              minimumTrackTintColor="#8A2BE2"
              maximumTrackTintColor="#333"
              thumbTintColor="#8A2BE2"
              onSlidingStart={() => setIsSliding(true)}
              onSlidingComplete={(val) => {
                setIsSliding(false);
                onSeek(val);
              }}
            />
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>

          {/* CONTROLS */}
          <View style={styles.controlsRow}>
            <TouchableOpacity onPress={() => skipTrack('prev')}>
              <Ionicons name="play-skip-back" size={40} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={togglePlayPause}>
              <Ionicons name={isPlaying ? "pause-circle" : "play-circle"} size={90} color="#8A2BE2" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => skipTrack('next')}>
              <Ionicons name="play-skip-forward" size={40} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: { backgroundColor: "#121212", borderTopWidth: 0, height: 65, paddingBottom: 10, position: "absolute" },
  miniPlayer: { position: "absolute", bottom: 85, left: 10, right: 10, height: 65, backgroundColor: "#1E1E1E", borderRadius: 12, flexDirection: "row", alignItems: "center", padding: 10, zIndex: 1000 },
  miniCover: { width: 45, height: 45, borderRadius: 6 },
  miniTitle: { color: "#FFF", fontWeight: "bold", fontSize: 14 },
  miniArtist: { color: "#AAA", fontSize: 12 },
  fullPlayer: { flex: 1, backgroundColor: "#000", alignItems: "center", padding: 40 },
  closeBtn: { alignSelf: "flex-start", marginBottom: 20 },
  fullCover: { width: 320, height: 320, borderRadius: 20, marginBottom: 30 },
  fullTitle: { color: "#FFF", fontSize: 26, fontWeight: "bold", textAlign: "center" },
  fullArtist: { color: "#AAA", fontSize: 18, marginBottom: 40 },
  progressContainer: { width: '100%', marginBottom: 30 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -5 },
  timeText: { color: '#888', fontSize: 12 },
  controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', width: '80%' }
});