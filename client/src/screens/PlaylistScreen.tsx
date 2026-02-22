import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import Constants from "expo-constants";

const hostUri = Constants.expoConfig?.hostUri;
const localIp = hostUri ? hostUri.split(":")[0] : "localhost";
const API_URL = `http://${localIp}:5000/api/playlists`;

export default function PlaylistScreen({
  onPlay,
}: {
  onPlay?: (song: any) => void;
}) {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Modal State
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Detail Modal State
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);

  const fetchPlaylists = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL);
      setPlaylists(res.data.data);
    } catch (error: any) {
      console.error(
        "Fetch playlists error:",
        error.response?.data || error.message,
      );
      Alert.alert("Error", "Could not load playlists.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistTitle.trim()) {
      return Alert.alert("Error", "Playlist title cannot be empty.");
    }

    setIsCreating(true);
    try {
      await axios.post(API_URL, {
        title: newPlaylistTitle.trim(),
        is_public: false,
      });
      setNewPlaylistTitle("");
      setIsCreateModalVisible(false);
      fetchPlaylists(); // Refresh the list
    } catch (error: any) {
      Alert.alert("Error", "Failed to create playlist.");
    } finally {
      setIsCreating(false);
    }
  };

  const handlePlaySong = (song: any) => {
    if (onPlay) {
      onPlay(song);
    } else {
      Alert.alert("Error", "Playback not connected.");
    }
  };

  // --- RENDERS ---

  const renderPlaylistItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.playlistCard}
      activeOpacity={0.7}
      onPress={() => setSelectedPlaylist(item)} // OPEN DETAIL MODAL
    >
      <View style={styles.playlistIconContainer}>
        <Ionicons name="albums" size={24} color="#FFF" />
      </View>
      <View style={styles.playlistInfo}>
        <Text style={styles.playlistTitle}>{item.title}</Text>
        <Text style={styles.playlistCount}>
          {item.songs?.length || 0}{" "}
          {item.songs?.length === 1 ? "song" : "songs"}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#555" />
    </TouchableOpacity>
  );

  const renderSongItem = ({ item }: { item: any }) => {
    // The junction table returns { id, playlist_id, song_id, song: { actual song data } }
    const actualSong = item.song;

    if (!actualSong) return null;

    return (
      <TouchableOpacity
        style={styles.songCard}
        onPress={() => handlePlaySong(actualSong)}
      >
        <Image
          source={{ uri: actualSong.cover_image_url }}
          style={styles.songCover}
        />
        <View style={styles.songInfo}>
          <Text style={styles.songTitle} numberOfLines={1}>
            {actualSong.title}
          </Text>
          <Text style={styles.songArtist} numberOfLines={1}>
            {actualSong.artist}
          </Text>
        </View>
        <Ionicons name="play-circle" size={32} color="#8A2BE2" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Your Library</Text>
        <TouchableOpacity onPress={() => setIsCreateModalVisible(true)}>
          <Ionicons name="add-circle" size={36} color="#8A2BE2" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#8A2BE2"
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(item, index) =>
            item.song_id ? item.song_id.toString() : index.toString()
          }
          renderItem={renderPlaylistItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="albums-outline" size={60} color="#333" />
              <Text style={styles.emptyText}>
                You haven't created any playlists yet.
              </Text>
            </View>
          )}
        />
      )}

      {/* --- CREATE PLAYLIST MODAL --- */}
      <Modal
        visible={isCreateModalVisible}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>New Playlist</Text>
            <TextInput
              style={styles.input}
              placeholder="My Awesome Playlist"
              placeholderTextColor="#555"
              value={newPlaylistTitle}
              onChangeText={setNewPlaylistTitle}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsCreateModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={handleCreatePlaylist}
                disabled={isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.createBtnText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- PLAYLIST DETAIL FULL-SCREEN MODAL --- */}
      <Modal
        visible={!!selectedPlaylist}
        animationType="slide"
        transparent={false}
      >
        <SafeAreaView style={styles.detailContainer}>
          <View style={styles.detailHeader}>
            <TouchableOpacity
              onPress={() => setSelectedPlaylist(null)}
              style={styles.backBtn}
            >
              <Ionicons name="chevron-back" size={32} color="#FFF" />
              <Text style={styles.backText}>Library</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.detailTitleContainer}>
            <Ionicons
              name="albums"
              size={60}
              color="#8A2BE2"
              style={{ marginBottom: 10 }}
            />
            <Text style={styles.detailTitle}>{selectedPlaylist?.title}</Text>
            <Text style={styles.detailCount}>
              {selectedPlaylist?.songs?.length || 0}{" "}
              {selectedPlaylist?.songs?.length === 1 ? "song" : "songs"}
            </Text>
          </View>

          <FlatList
            data={selectedPlaylist?.songs || []}
            keyExtractor={(item) => item.id}
            renderItem={renderSongItem}
            contentContainerStyle={{ paddingBottom: 50, paddingHorizontal: 20 }}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Ionicons name="musical-notes-outline" size={50} color="#333" />
                <Text style={styles.emptyText}>This playlist is empty.</Text>
                <Text style={styles.emptySubText}>
                  Go to Home and add some tracks.
                </Text>
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  header: { color: "#FFF", fontSize: 34, fontWeight: "900" },
  playlistCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  playlistIconContainer: {
    width: 50,
    height: 50,
    backgroundColor: "#222",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  playlistInfo: { flex: 1 },
  playlistTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  playlistCount: { color: "#888", fontSize: 14 },
  emptyContainer: { alignItems: "center", marginTop: 100 },
  emptyText: { color: "#555", fontSize: 16, marginTop: 10 },
  emptySubText: { color: "#444", fontSize: 14, marginTop: 5 },

  // Create Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: { backgroundColor: "#161616", padding: 25, borderRadius: 15 },
  modalHeader: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#000",
    color: "#FFF",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333",
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: { flexDirection: "row", justifyContent: "space-between" },
  cancelBtn: {
    flex: 1,
    padding: 15,
    alignItems: "center",
    marginRight: 10,
    backgroundColor: "#333",
    borderRadius: 10,
  },
  cancelBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
  createBtn: {
    flex: 1,
    padding: 15,
    alignItems: "center",
    marginLeft: 10,
    backgroundColor: "#8A2BE2",
    borderRadius: 10,
  },
  createBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },

  // Detail Modal Styles
  detailContainer: { flex: 1, backgroundColor: "#000" },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingTop: 40,
  },
  backBtn: { flexDirection: "row", alignItems: "center" },
  backText: { color: "#FFF", fontSize: 18, marginLeft: 5 },
  detailTitleContainer: { alignItems: "center", marginBottom: 30 },
  detailTitle: {
    color: "#FFF",
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  detailCount: { color: "#888", fontSize: 16, marginTop: 5 },

  // Song Card Styles
  songCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  songCover: { width: 50, height: 50, borderRadius: 8, marginRight: 15 },
  songInfo: { flex: 1 },
  songTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  songArtist: { color: "#AAA", fontSize: 14 },
});
