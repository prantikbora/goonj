import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text, Alert, ScrollView } from 'react-native';
import axios from 'axios';

export default function UploadScreen({ apiUrl, onUploadSuccess }: any) {
  // --- STATE ---
  // Added 'lyrics' to the payload so it reaches your Express backend
  const [form, setForm] = useState({ 
    title: '', 
    artist: '', 
    language: 'Assamese', 
    audio_url: '', 
    cover_image_url: '',
    lyrics: '' 
  });

  // --- HANDLER ---
  const handleUpload = async () => {
    if (!form.title || !form.artist || !form.audio_url) {
      return Alert.alert("Validation Error", "Title, Artist, and Audio URL are required.");
    }
    
    try {
      await axios.post(apiUrl, form);
      Alert.alert("Success", "Goonj updated with new track!");
      
      // Wipe the form clean after successful upload
      setForm({ 
        title: '', 
        artist: '', 
        language: 'Assamese', 
        audio_url: '', 
        cover_image_url: '', 
        lyrics: '' 
      });
      
      onUploadSuccess(); // Trigger App.tsx to re-fetch the database
    } catch (e: any) { 
      Alert.alert("Error", "Upload failed. Check your Node server connection."); 
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <Text style={styles.header}>Upload to Goonj</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="Song Title" 
        placeholderTextColor="#555" 
        value={form.title} 
        onChangeText={t => setForm({...form, title: t})} 
      />
      
      <TextInput 
        style={styles.input} 
        placeholder="Artist Name" 
        placeholderTextColor="#555" 
        value={form.artist} 
        onChangeText={t => setForm({...form, artist: t})} 
      />
      
      <TextInput 
        style={styles.input} 
        placeholder="Audio URL (.mp3 format)" 
        placeholderTextColor="#555" 
        value={form.audio_url} 
        onChangeText={t => setForm({...form, audio_url: t})} 
        autoCapitalize="none" // Important for URLs
        autoCorrect={false}
      />
      
      <TextInput 
        style={styles.input} 
        placeholder="Cover Image URL" 
        placeholderTextColor="#555" 
        value={form.cover_image_url} 
        onChangeText={t => setForm({...form, cover_image_url: t})} 
        autoCapitalize="none"
        autoCorrect={false}
      />

      {/* --- LYRICS TEXT AREA --- */}
      <TextInput 
        style={[styles.input, styles.textArea]} 
        placeholder="Paste Lyrics Here (Optional)" 
        placeholderTextColor="#555" 
        value={form.lyrics} 
        onChangeText={t => setForm({...form, lyrics: t})} 
        multiline={true}
        textAlignVertical="top" // Ensures text starts at the top of the box on Android
      />

      <TouchableOpacity style={styles.btn} onPress={handleUpload} activeOpacity={0.8}>
        <Text style={styles.btnText}>Submit Track</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000', 
    padding: 25, 
    paddingTop: 60 
  },
  header: { 
    color: '#FFF', 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 20 
  },
  input: { 
    backgroundColor: '#111', 
    color: '#FFF', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#333',
    fontSize: 16
  },
  textArea: {
    height: 150,
    paddingTop: 15 // Keeps text from hugging the very top edge inside the multiline box
  },
  btn: { 
    backgroundColor: '#8A2BE2', 
    padding: 18, 
    borderRadius: 10, 
    alignItems: 'center',
    marginTop: 10
  },
  btnText: { 
    color: '#FFF', 
    fontWeight: 'bold',
    fontSize: 16
  }
});