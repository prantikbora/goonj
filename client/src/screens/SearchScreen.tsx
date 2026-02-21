import React, { useState } from 'react';
import { StyleSheet, View, TextInput, FlatList, Text, Image, TouchableOpacity } from 'react-native';

export default function SearchScreen({ songs, onPlay }: any) {
  const [query, setQuery] = useState('');

  // Filter songs by title, artist, or language
  const filteredSongs = songs.filter((song: any) =>
    song.title.toLowerCase().includes(query.toLowerCase()) ||
    song.artist.toLowerCase().includes(query.toLowerCase()) ||
    song.language.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search</Text>
      
      <TextInput 
        style={styles.searchInput}
        placeholder="Search songs, artists, or languages..."
        placeholderTextColor="#888"
        value={query}
        onChangeText={setQuery}
        autoFocus={false}
      />

      <FlatList
        data={query.length > 0 ? filteredSongs : []}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={() => (
          <View style={styles.centered}>
            <Text style={styles.placeholderText}>
              {query.length > 0 ? "No songs found." : "Type to find your favorite Goonj..."}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.songCard} onPress={() => onPlay(item)}>
            <Image source={{ uri: item.cover_image_url }} style={styles.coverImage} />
            <View style={styles.textContainer}>
              <Text style={styles.songTitle}>{item.title}</Text>
              <Text style={styles.artist}>{item.artist}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingHorizontal: 20, paddingTop: 60 },
  title: { color: '#FFF', fontSize: 28, fontWeight: '800', marginBottom: 20 },
  searchInput: { backgroundColor: '#1A1A1A', borderRadius: 10, padding: 15, color: '#FFF', fontSize: 16, marginBottom: 20, borderWidth: 1, borderColor: '#333' },
  centered: { marginTop: 50, alignItems: 'center' },
  placeholderText: { color: '#555', fontSize: 16 },
  songCard: { flexDirection: 'row', marginBottom: 15, alignItems: 'center' },
  coverImage: { width: 50, height: 50, borderRadius: 5, marginRight: 15 },
  textContainer: { flex: 1 },
  songTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  artist: { color: '#AAA', fontSize: 13 },
});