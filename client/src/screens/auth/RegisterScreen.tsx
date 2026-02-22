import React, { useState, useContext } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from "@expo/vector-icons"; // <-- REQUIRED FOR THE EYE ICON
import axios from 'axios';
import Constants from 'expo-constants';
import { AuthContext } from '../../context/AuthContext';

const hostUri = Constants.expoConfig?.hostUri;
const localIp = hostUri ? hostUri.split(":")[0] : "localhost";
const API_URL = `http://${localIp}:5000/api/auth/register`;

export default function RegisterScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // <-- NEW TOGGLE STATE
  const [loading, setLoading] = useState(false);

  const authContext = useContext(AuthContext);

  const handleRegister = async () => {
    if (!username || !email || !password) return Alert.alert("Error", "All fields are required.");
    
    setLoading(true);
    try {
      const res = await axios.post(API_URL, { username, email, password });
      // Instantly log them in after registration
      await authContext?.login(res.data.token, res.data.user);
    } catch (e: any) {
      Alert.alert("Registration Failed", e.response?.data?.message || "Check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Join Goonj</Text>
      <Text style={styles.subHeader}>Create an account to build playlists</Text>

      <TextInput 
        style={styles.input} 
        placeholder="Username" 
        placeholderTextColor="#555" 
        value={username} 
        onChangeText={setUsername} 
        autoCapitalize="none"
      />
      <TextInput 
        style={styles.input} 
        placeholder="Email" 
        placeholderTextColor="#555" 
        value={email} 
        onChangeText={setEmail} 
        autoCapitalize="none" 
        keyboardType="email-address"
      />
      
      {/* --- WRAPPED PASSWORD FIELD --- */}
      <View style={styles.passwordContainer}>
        <TextInput 
          style={styles.passwordInput} 
          placeholder="Password" 
          placeholderTextColor="#555" 
          value={password} 
          onChangeText={setPassword} 
          secureTextEntry={!showPassword} // Toggle based on state
        />
        <TouchableOpacity 
          style={styles.eyeIcon} 
          onPress={() => setShowPassword(!showPassword)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color="#888" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Register</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.linkText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 25, justifyContent: 'center' },
  header: { color: '#8A2BE2', fontSize: 36, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
  subHeader: { color: '#AAA', fontSize: 16, textAlign: 'center', marginBottom: 40 },
  
  input: { backgroundColor: '#111', color: '#FFF', padding: 16, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#333', fontSize: 16 },
  
  // New styles for the password wrapper
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  passwordInput: {
    flex: 1,
    color: '#FFF',
    padding: 16,
    fontSize: 16,
  },
  eyeIcon: {
    paddingRight: 15,
  },
  
  btn: { backgroundColor: '#8A2BE2', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  linkBtn: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#888', fontSize: 14 }
});