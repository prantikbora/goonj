import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text, Alert, ScrollView } from 'react-native';
import axios from 'axios';

export default function UploadScreen({ apiUrl, onUploadSuccess }: any) {
  const [form, setForm] = useState({ title: '', artist: '', language: 'Assamese', audio_url: '', cover_image_url: '' });

  const handleUpload = async () => {
    if (!form.title || !form.artist || !form.audio_url) return Alert.alert("Error", "Fill required fields");
    try {
      await axios.post(apiUrl, form);
      Alert.alert("Success", "Goonj updated!");
      setForm({ title: '', artist: '', language: 'Assamese', audio_url: '', cover_image_url: '' });
      onUploadSuccess();
    } catch (e) { Alert.alert("Error", "Upload failed"); }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Upload to Goonj</Text>
      <TextInput style={styles.input} placeholder="Title" placeholderTextColor="#555" value={form.title} onChangeText={t => setForm({...form, title: t})} />
      <TextInput style={styles.input} placeholder="Artist" placeholderTextColor="#555" value={form.artist} onChangeText={t => setForm({...form, artist: t})} />
      <TextInput style={styles.input} placeholder="Audio URL (.mp3)" placeholderTextColor="#555" value={form.audio_url} onChangeText={t => setForm({...form, audio_url: t})} />
      <TextInput style={styles.input} placeholder="Cover URL" placeholderTextColor="#555" value={form.cover_image_url} onChangeText={t => setForm({...form, cover_image_url: t})} />
      <TouchableOpacity style={styles.btn} onPress={handleUpload}><Text style={styles.btnText}>Submit</Text></TouchableOpacity>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 25, paddingTop: 60 },
  header: { color: '#FFF', fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  input: { backgroundColor: '#111', color: '#FFF', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  btn: { backgroundColor: '#8A2BE2', padding: 18, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold' }
});