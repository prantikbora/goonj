import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Text,
  StatusBar,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import axios from "axios";
import Constants from "expo-constants";

import HomeScreen from "./src/screens/HomeScreen";
import SearchScreen from "./src/screens/SearchScreen";

export type RootTabParamList = {
  Home: undefined;
  Search: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

// Dynamic IP Logic
const hostUri = Constants.expoConfig?.hostUri;
const localIp = hostUri ? hostUri.split(":")[0] : "localhost";
const API_URL = `http://${localIp}:5000/api/songs`;

export default function App() {
  const [songs, setSongs] = useState([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [currentSong, setCurrentSong] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Unified Fetch Function
  const fetchSongs = async () => {
    try {
      console.log("--- GOONJ DEBUG ---");
      console.log("Attempting to fetch songs from:", API_URL);
      const res = await axios.get(API_URL);
      setSongs(res.data.data);
      console.log("Fetch Success! Items found:", res.data.data.length);
    } catch (e: any) {
      console.error("Fetch failed at URL:", API_URL);
      console.error("Error Message:", e.message);
    }
  };

  useEffect(() => {
    fetchSongs();
    // Cleanup: Only unload if sound exists when app closes
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, []); // Only run on mount

  const playSong = useCallback(
    async (song: any) => {
      try {
        if (sound) await sound.unloadAsync();
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: song.audio_url },
          { shouldPlay: true },
        );
        setSound(newSound);
        setCurrentSong(song);
        setIsPlaying(true);
      } catch (error) {
        console.error("Playback Error:", error);
      }
    },
    [sound],
  );

  const togglePlayPause = async () => {
    if (!sound) return;
    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
    setIsPlaying(!isPlaying);
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
            tabBarInactiveTintColor: "#888",
            tabBarIcon: ({ color, size }) => {
              let iconName: any;
              if (route.name === "Home") iconName = "home";
              else if (route.name === "Search") iconName = "search";
              return <Ionicons name={iconName} size={size} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Home">
            {() => (
              <HomeScreen
                songs={songs}
                onPlay={playSong}
                currentSongId={currentSong?.id}
              />
            )}
          </Tab.Screen>
          <Tab.Screen name="Search">
            {() => <SearchScreen songs={songs} onPlay={playSong} />}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>

      {/* Mini Player */}
      {currentSong && (
        <View style={styles.miniPlayer}>
          <Image
            source={{ uri: currentSong.cover_image_url }}
            style={styles.miniCover}
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.miniTitle} numberOfLines={1}>
              {currentSong.title}
            </Text>
            <Text style={styles.miniArtist}>{currentSong.artist}</Text>
          </View>
          <TouchableOpacity onPress={togglePlayPause}>
            <Text style={{ color: "#FFF", fontSize: 28, marginRight: 10 }}>
              {isPlaying ? "⏸" : "▶"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#121212",
    borderTopWidth: 0,
    height: 65,
    paddingBottom: 10,
    position: "absolute",
  },
  miniPlayer: {
    position: "absolute",
    bottom: 85,
    left: 10,
    right: 10,
    height: 65,
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    elevation: 5,
    zIndex: 1000,
  },
  miniCover: { width: 45, height: 45, borderRadius: 6 },
  miniTitle: { color: "#FFF", fontWeight: "bold", fontSize: 14 },
  miniArtist: { color: "#AAA", fontSize: 12 },
});