import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, ScrollView } from 'react-native';

const CATEGORIES = ['All', 'Assamese', 'Hindi', 'English'];

export default function HomeScreen({ songs, onPlay, currentSongId }: any) {
  const [activeCategory, setActiveCategory] = useState('All');

  // Logic: Case-insensitive filtering to prevent "empty screen" bugs
  const filteredSongs = activeCategory === 'All' 
    ? songs 
    : songs.filter((s: any) => s.language?.toLowerCase() === activeCategory.toLowerCase());

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Goonj</Text>

      {/* Category Selection */}
      <View style={styles.categoryWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity 
              key={cat} 
              onPress={() => setActiveCategory(cat)}
              style={[styles.pill, activeCategory === cat && styles.activePill]}
            >
              <Text style={[styles.pillText, activeCategory === cat && styles.activePillText]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <FlatList
        data={filteredSongs}
        keyExtractor={(item) => item.id}
        // Ensure the list can be scrolled even with the absolute tab bar
        contentContainerStyle={{ paddingBottom: 150 }} 
        ListEmptyComponent={() => (
          <View style={styles.centered}>
            <Text style={{ color: '#555' }}>No {activeCategory} songs found in database.</Text>
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
            {currentSongId === item.id && <View style={styles.playingIndicator} />}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingHorizontal: 20, paddingTop: 60 },
  header: { color: '#FFF', fontSize: 32, fontWeight: '900', marginBottom: 15 },
  categoryWrapper: { height: 50, marginBottom: 10 },
  pill: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1A1A1A', marginRight: 10, height: 38, justifyContent: 'center' },
  activePill: { backgroundColor: '#8A2BE2' },
  pillText: { color: '#888', fontWeight: '600' },
  activePillText: { color: '#FFF' },
  songCard: { flexDirection: 'row', marginBottom: 12, backgroundColor: '#161616', padding: 12, borderRadius: 12, alignItems: 'center' },
  activeCard: { borderColor: '#333', borderWidth: 1 },
  coverImage: { width: 50, height: 50, borderRadius: 6, marginRight: 15 },
  textContainer: { flex: 1 },
  title: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  artist: { color: '#888', fontSize: 13 },
  playingIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#8A2BE2' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 }
});