import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from "@expo/vector-icons";

export default function SearchScreen({ songs, onPlay }: any) {
  // --- State ---
  const [searchQuery, setSearchQuery] = useState('');

  // --- Search Logic ---
  // If the search bar is empty, show nothing. 
  // Otherwise, filter by both title and artist, ignoring case and whitespace.
  const filteredResult = searchQuery.trim() === '' 
    ? [] 
    : songs.filter((s: any) => 
        (s.title && s.title.toLowerCase().includes(searchQuery.toLowerCase().trim())) || 
        (s.artist && s.artist.toLowerCase().includes(searchQuery.toLowerCase().trim()))
      );

  return (
    <View style={styles.container}>
      {/* --- HEADER --- */}
      <Text style={styles.header}>Search</Text>
      
      {/* --- SEARCH INPUT --- */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search songs, artists..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {/* Only show the clear button if there is text */}
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {/* --- RESULTS LIST --- */}
      <FlatList
        data={filteredResult}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 150 }}
        ListEmptyComponent={() => (
          <View style={styles.centered}>
            <Text style={{ color: '#555', fontSize: 16 }}>
              {searchQuery.trim() === '' 
                ? 'Start typing to find music.' 
                : 'No results found.'}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.songCard} 
            onPress={() => onPlay(item)}
            activeOpacity={0.7}
          >
            <Image source={{ uri: item.cover_image_url }} style={styles.coverImage} />
            <View style={styles.textContainer}>
              <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.artist}>{item.artist}</Text>
            </View>
            <Ionicons name="play-circle-outline" size={28} color="#8A2BE2" />
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
  header: { 
    color: '#FFF', 
    fontSize: 34, 
    fontWeight: '900', 
    marginBottom: 20 
  },
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#161616', 
    borderRadius: 12, 
    paddingHorizontal: 15, 
    height: 50, 
    marginBottom: 20 
  },
  searchIcon: { 
    marginRight: 10 
  },
  searchInput: { 
    flex: 1, 
    color: '#FFF', 
    fontSize: 16 
  },
  songCard: { 
    flexDirection: 'row', 
    marginBottom: 12, 
    backgroundColor: '#161616', 
    padding: 12, 
    borderRadius: 12, 
    alignItems: 'center' 
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
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 100 
  }
});