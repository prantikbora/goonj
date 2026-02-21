import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from "@expo/vector-icons";

// Static categories array
const CATEGORIES = ['All', 'Favorites', 'Assamese', 'Hindi', 'English'];

export default function HomeScreen({ songs, onPlay, currentSongId, favorites, onShuffle, onResetShuffle }: any) {
  // --- State ---
  const [activeCategory, setActiveCategory] = useState('All');

  // --- Filtering Logic (Must be INSIDE the component to access state/props) ---
  const filteredSongs = songs.filter((s: any) => {
    if (activeCategory === 'All') return true;
    if (activeCategory === 'Favorites') return favorites.includes(s.id);
    return s.language?.toLowerCase() === activeCategory.toLowerCase();
  });

  return (
    <View style={styles.container}>
      {/* --- HEADER SECTION --- */}
      <View style={styles.headerRow}>
        <Text style={styles.header}>Goonj</Text>
        
        {/* Shuffle Controls Container */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          
          {/* RESET SHUFFLE BUTTON */}
          <TouchableOpacity 
            style={[styles.shuffleBtn, { marginRight: 10, backgroundColor: '#333', paddingHorizontal: 10 }]} 
            onPress={onResetShuffle}
            activeOpacity={0.8}
          >
            <Ionicons name="close-circle-outline" size={20} color="#FFF" />
          </TouchableOpacity>

          {/* START SHUFFLE BUTTON */}
          <TouchableOpacity 
            style={styles.shuffleBtn} 
            onPress={() => onShuffle(filteredSongs)}
            activeOpacity={0.8}
          >
            <Ionicons name="shuffle" size={20} color="#FFF" />
            <Text style={styles.shuffleLabel}>Shuffle</Text>
          </TouchableOpacity>
          
        </View>
      </View>

      {/* --- CATEGORY PILLS SECTION --- */}
      <View style={styles.categoryWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity 
              key={cat} 
              onPress={() => setActiveCategory(cat)}
              style={[styles.pill, activeCategory === cat && styles.activePill]}
            >
              <Text style={[styles.pillText, activeCategory === cat && styles.activePillText]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* --- SONG LIST SECTION --- */}
      <FlatList
        data={filteredSongs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 150 }} 
        ListEmptyComponent={() => (
          <View style={styles.centered}>
            <Text style={{ color: '#555', fontSize: 16 }}>
              {activeCategory === 'Favorites' 
                ? "You haven't added any favorites yet." 
                : `No ${activeCategory} songs found in database.`}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.songCard, currentSongId === item.id && styles.activeCard]} 
            onPress={() => onPlay(item)}
            activeOpacity={0.7}
          >
            <Image source={{ uri: item.cover_image_url }} style={styles.coverImage} />
            <View style={styles.textContainer}>
              <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.artist}>{item.artist}</Text>
            </View>
            
            {/* Show an active indicator if this song is currently playing */}
            {currentSongId === item.id && <View style={styles.playingIndicator} />}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000', 
    paddingHorizontal: 20, 
    paddingTop: 60 
  },
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  header: { 
    color: '#FFF', 
    fontSize: 34, 
    fontWeight: '900' 
  },
  shuffleBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#8A2BE2', 
    paddingHorizontal: 15, 
    paddingVertical: 10, 
    borderRadius: 20 
  },
  shuffleLabel: { 
    color: '#FFF', 
    fontWeight: 'bold', 
    marginLeft: 8, 
    fontSize: 14 
  },
  categoryWrapper: { 
    height: 50, 
    marginBottom: 10 
  },
  pill: { 
    paddingHorizontal: 20, 
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: '#1A1A1A', 
    marginRight: 10, 
    height: 38, 
    justifyContent: 'center' 
  },
  activePill: { 
    backgroundColor: '#8A2BE2' 
  },
  pillText: { 
    color: '#888', 
    fontWeight: '600' 
  },
  activePillText: { 
    color: '#FFF' 
  },
  songCard: { 
    flexDirection: 'row', 
    marginBottom: 12, 
    backgroundColor: '#161616', 
    padding: 12, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  activeCard: { 
    borderColor: '#333', 
    borderWidth: 1 
  },
  coverImage: { 
    width: 55, 
    height: 55, 
    borderRadius: 8, 
    marginRight: 15 
  },
  textContainer: { 
    flex: 1 
  },
  title: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: '600',
    marginBottom: 4
  },
  artist: { 
    color: '#888', 
    fontSize: 13 
  },
  playingIndicator: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: '#8A2BE2',
    marginLeft: 10
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 100 
  }
});