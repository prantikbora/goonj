import React, { useEffect, useState, useCallback, useContext } from "react";
import { View, StyleSheet, TouchableOpacity, Image, Text, StatusBar, Modal, Alert, SafeAreaView, ScrollView, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import Slider from "@react-native-community/slider";
import axios from "axios";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

// --- Screens & Context ---
import HomeScreen from "./src/screens/HomeScreen";
import SearchScreen from "./src/screens/SearchScreen";
import UploadScreen from "./src/screens/UploadScreen";
import LoginScreen from "./src/screens/auth/LoginScreen";
import RegisterScreen from "./src/screens/auth/RegisterScreen";
import PlaylistScreen from "./src/screens/PlaylistScreen";
import { AuthProvider, AuthContext } from "./src/context/AuthContext";

// --- Types & Constants ---
export type RootTabParamList = { Home: undefined; Search: undefined; Upload: undefined; Library: undefined; };
const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator();

const hostUri = Constants.expoConfig?.hostUri;
const localIp = hostUri ? hostUri.split(":")[0] : "localhost";
const API_URL = `http://${localIp}:5000/api/songs`;
const PLAYLIST_API_URL = `http://${localIp}:5000/api/playlists`;
const FAV_KEY = "goonj-favorites";

// ==========================================
// 1. MAIN AUTHENTICATED APP (Music Player)
// ==========================================
function MainApp() {
  const [songs, setSongs] = useState<any[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [currentSong, setCurrentSong] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullPlayerVisible, setIsFullPlayerVisible] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);

  const [progress, setProgress] = useState(0);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);

  // --- NEW: Add to Playlist State ---
  const [isPlaylistModalVisible, setIsPlaylistModalVisible] = useState(false);
  const [myPlaylists, setMyPlaylists] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [res, storedFavs] = await Promise.all([
        axios.get(API_URL),
        AsyncStorage.getItem(FAV_KEY)
      ]);
      setSongs(res.data.data);
      if (storedFavs) setFavorites(JSON.parse(storedFavs));
    } catch (e: any) {
      console.error("Initialization Failed:", e.message);
    }
  }, []);

  useEffect(() => {
    fetchData();
    return () => { if (sound) sound.unloadAsync(); };
  }, [fetchData]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sleepTimer !== null && sleepTimer > 0) {
      interval = setInterval(() => {
        setSleepTimer((prev) => (prev !== null ? prev - 1 : null));
      }, 60000);
    } else if (sleepTimer === 0) {
      stopPlayback();
      setSleepTimer(null);
      Alert.alert("Goonj", "Sleep timer reached. Goodnight!");
    }
    return () => clearInterval(interval);
  }, [sleepTimer]);

  const onPlaybackStatusUpdate = useCallback((status: any) => {
    if (status.isLoaded) {
      if (!isSliding) {
        setProgress(status.positionMillis / (status.durationMillis || 1));
        setPosition(status.positionMillis);
        setDuration(status.durationMillis || 0);
      }
      setIsPlaying(status.isPlaying);
      if (status.didJustFinish) skipTrack("next");
    }
  }, [isSliding]);

  const playSong = async (song: any) => {
    try {
      if (sound) await sound.unloadAsync();
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: song.audio_url },
        { shouldPlay: true },
        onPlaybackStatusUpdate,
      );
      setSound(newSound);
      setCurrentSong(song);
      setShowLyrics(false);
    } catch (error) {
      Alert.alert("Playback Error", "Could not load this track.");
    }
  };

  const stopPlayback = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  };

  const togglePlayPause = async () => {
    if (!sound) return;
    isPlaying ? await sound.pauseAsync() : await sound.playAsync();
  };

  const skipTrack = (direction: "next" | "prev") => {
    const currentIndex = songs.findIndex((s) => s.id === currentSong?.id);
    let nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= songs.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = songs.length - 1;
    playSong(songs[nextIndex]);
  };

  const onSeek = async (value: number) => {
    if (sound) await sound.setPositionAsync(value * duration);
  };

  const shuffleAndPlay = (filteredList: any[]) => {
    if (filteredList.length === 0) return;
    const shuffled = [...filteredList].sort(() => Math.random() - 0.5);
    setSongs(shuffled);
    setTimeout(() => playSong(shuffled[0]), 100);
  };

  const resetShuffle = async () => {
    try {
      const res = await axios.get(API_URL);
      setSongs(res.data.data);
      Alert.alert("Goonj", "Shuffle disabled. Returning to original order.");
    } catch (e) {
      console.error("Failed to reset shuffle order");
    }
  };

  const toggleFavorite = async (songId: string) => {
    const updated = favorites.includes(songId) 
      ? favorites.filter(id => id !== songId) 
      : [...favorites, songId];
    setFavorites(updated);
    await AsyncStorage.setItem(FAV_KEY, JSON.stringify(updated));
  };

  const formatTime = (millis: number) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${Number(seconds) < 10 ? "0" : ""}${seconds}`;
  };

  // --- NEW: Playlist Functions ---
  const openPlaylistModal = async () => {
    setIsPlaylistModalVisible(true);
    try {
      const res = await axios.get(PLAYLIST_API_URL);
      setMyPlaylists(res.data.data);
    } catch (error) {
      Alert.alert("Error", "Could not fetch your playlists.");
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!currentSong) return;
    try {
      await axios.post(`${PLAYLIST_API_URL}/add-song`, {
        playlistId,
        songId: currentSong.id
      });
      Alert.alert("Success", "Song added to playlist!");
      setIsPlaylistModalVisible(false);
    } catch (error: any) {
      Alert.alert("Notice", error.response?.data?.message || "Failed to add song.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      <Tab.Navigator
        id="main-tabs" 
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: "#8A2BE2",
          tabBarIcon: ({ color, size }) => {
            const icons: Record<string, string> = { Home: "home", Search: "search", Upload: "cloud-upload", Library: "albums" };
            return <Ionicons name={icons[route.name] as any} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home">{() => <HomeScreen songs={songs} onPlay={playSong} currentSongId={currentSong?.id} favorites={favorites} onShuffle={shuffleAndPlay} onResetShuffle={resetShuffle} />}</Tab.Screen>
        <Tab.Screen name="Search">{() => <SearchScreen songs={songs} onPlay={playSong} />}</Tab.Screen>
        <Tab.Screen name="Upload">{() => <UploadScreen apiUrl={API_URL} onUploadSuccess={fetchData} />}</Tab.Screen>
       <Tab.Screen name="Library">{() => <PlaylistScreen onPlay={playSong} />}</Tab.Screen>
      </Tab.Navigator>

      {/* MINI PLAYER */}
      {currentSong && !isFullPlayerVisible && (
        <TouchableOpacity style={styles.miniPlayer} activeOpacity={0.9} onPress={() => setIsFullPlayerVisible(true)}>
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

      {/* FULL PLAYER MODAL */}
      <Modal visible={isFullPlayerVisible} animationType="slide">
        <View style={styles.fullPlayer}>
          
          <View style={styles.fullHeader}>
            <TouchableOpacity onPress={() => setIsFullPlayerVisible(false)}>
              <Ionicons name="chevron-down" size={36} color="#FFF" />
            </TouchableOpacity>
            
            <View style={styles.headerRightControls}>
              {/* NEW: Add to Playlist Button */}
              <TouchableOpacity onPress={openPlaylistModal} style={styles.iconBtn}>
                <Ionicons name="list" size={28} color="#FFF" />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setShowLyrics(!showLyrics)} style={styles.iconBtn}>
                <Ionicons name="document-text" size={28} color={showLyrics ? "#8A2BE2" : "#FFF"} />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setSleepTimer(sleepTimer ? null : 30)} style={styles.iconBtn}>
                <Ionicons name="timer-outline" size={28} color={sleepTimer ? "#8A2BE2" : "#FFF"} />
                {sleepTimer !== null && <Text style={styles.timerText}>{sleepTimer}m</Text>}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => toggleFavorite(currentSong?.id)} style={styles.iconBtn}>
                <Ionicons name={favorites.includes(currentSong?.id) ? "heart" : "heart-outline"} size={30} color={favorites.includes(currentSong?.id) ? "#8A2BE2" : "#FFF"} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.mainContentArea}>
            {showLyrics ? (
              <ScrollView style={styles.lyricsScrollView} contentContainerStyle={{ paddingBottom: 20 }}>
                <Text style={styles.lyricsTitle}>{currentSong?.title}</Text>
                <Text style={styles.lyricsText}>{currentSong?.lyrics ? currentSong.lyrics : "Lyrics are not available for this track yet."}</Text>
              </ScrollView>
            ) : (
              <>
                <Image source={{ uri: currentSong?.cover_image_url }} style={styles.fullCover} />
                <View style={{ width: '100%', alignItems: 'center' }}>
                  <Text style={styles.fullTitle} numberOfLines={2}>{currentSong?.title}</Text>
                  <Text style={styles.fullArtist}>{currentSong?.artist}</Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.progressContainer}>
            <Slider style={{ width: "100%", height: 40 }} minimumValue={0} maximumValue={1} value={progress} minimumTrackTintColor="#8A2BE2" maximumTrackTintColor="#333" thumbTintColor="#8A2BE2" onSlidingStart={() => setIsSliding(true)} onSlidingComplete={(val) => { setIsSliding(false); onSeek(val); }} />
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>

          <View style={styles.controlsRow}>
            <TouchableOpacity onPress={() => skipTrack("prev")}>
              <Ionicons name="play-skip-back" size={40} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={togglePlayPause}>
              <Ionicons name={isPlaying ? "pause-circle" : "play-circle"} size={90} color="#8A2BE2" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => skipTrack("next")}>
              <Ionicons name="play-skip-forward" size={40} color="#FFF" />
            </TouchableOpacity>
          </View>

        </View>

        {/* --- NEW: ADD TO PLAYLIST MODAL --- */}
        <Modal visible={isPlaylistModalVisible} animationType="fade" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalHeader}>Add to Playlist</Text>
              
              {myPlaylists.length === 0 ? (
                <Text style={{ color: '#888', textAlign: 'center', marginBottom: 20 }}>No playlists found. Create one in the Library tab first.</Text>
              ) : (
                <ScrollView style={{ maxHeight: 300, marginBottom: 20 }}>
                  {myPlaylists.map(playlist => (
                    <TouchableOpacity 
                      key={playlist.id} 
                      style={styles.playlistOption} 
                      onPress={() => handleAddToPlaylist(playlist.id)}
                    >
                      <Ionicons name="musical-notes" size={20} color="#8A2BE2" style={{ marginRight: 15 }} />
                      <Text style={styles.playlistOptionText}>{playlist.title}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsPlaylistModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </Modal>
    </SafeAreaView>
  );
}

// ==========================================
// 2. AUTH NAVIGATOR (Login / Register)
// ==========================================
function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// ==========================================
// 3. ROOT GATEKEEPER
// ==========================================
function RootNavigator() {
  const auth = useContext(AuthContext);

  if (auth?.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#8A2BE2" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" />
      {auth?.token ? <MainApp /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

// ==========================================
// 4. APP ENTRY POINT
// ==========================================
export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  tabBar: { backgroundColor: "#121212", borderTopWidth: 0, height: 65, paddingBottom: 10, position: "absolute" },
  miniPlayer: { position: "absolute", bottom: 85, left: 10, right: 10, height: 65, backgroundColor: "#1E1E1E", borderRadius: 12, flexDirection: "row", alignItems: "center", padding: 10, zIndex: 1000 },
  miniCover: { width: 45, height: 45, borderRadius: 6 },
  miniTitle: { color: "#FFF", fontWeight: "bold", fontSize: 14 },
  miniArtist: { color: "#AAA", fontSize: 12 },
  fullPlayer: { flex: 1, backgroundColor: "#000", alignItems: "center", padding: 30, paddingTop: 50 },
  fullHeader: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginBottom: 20 },
  headerRightControls: { flexDirection: "row", alignItems: "center" },
  iconBtn: { marginLeft: 20, alignItems: "center" },
  timerText: { color: "#8A2BE2", fontSize: 10, position: "absolute", bottom: -12 },
  mainContentArea: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  fullCover: { width: 320, height: 320, borderRadius: 20, marginBottom: 30 },
  fullTitle: { color: "#FFF", fontSize: 26, fontWeight: "bold", textAlign: "center" },
  fullArtist: { color: "#AAA", fontSize: 18, marginTop: 5 },
  lyricsScrollView: { flex: 1, width: '100%', paddingHorizontal: 10 },
  lyricsTitle: { color: "#FFF", fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  lyricsText: { color: "#CCC", fontSize: 18, lineHeight: 32, textAlign: "center" },
  progressContainer: { width: "100%", marginBottom: 20 },
  timeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: -5 },
  timeText: { color: "#888", fontSize: 12 },
  controlsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", width: "80%", marginBottom: 20 },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#161616', padding: 25, borderRadius: 15 },
  modalHeader: { color: '#FFF', fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  playlistOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#222', padding: 15, borderRadius: 10, marginBottom: 10 },
  playlistOptionText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  cancelBtn: { padding: 15, alignItems: 'center', backgroundColor: '#333', borderRadius: 10 },
  cancelBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});