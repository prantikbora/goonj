import React, { useState, useContext } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from "@expo/vector-icons"; // <-- Added for the eye icon
import axios from 'axios';
import Constants from 'expo-constants';
import { AuthContext } from '../../context/AuthContext';

const hostUri = Constants.expoConfig?.hostUri;
const localIp = hostUri ? hostUri.split(":")[0] : "localhost";
const API_URL = `http://${localIp}:5000/api/auth/login`;

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // <-- New state
  const [loading, setLoading] = useState(false);
  
  const authContext = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert("Error", "Email and password are required.");
    
    setLoading(true);
    try {
      const res = await axios.post(API_URL, { email, password });
      await authContext?.login(res.data.token, res.data.user);
    } catch (e: any) {
      Alert.alert("Login Failed", e.response?.data?.message || "Check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Goonj</Text>
      <Text style={styles.subHeader}>Log in to your account</Text>

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

      <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Login</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.navigate('Register')}>
        <Text style={styles.linkText}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 25, justifyContent: 'center' },
  header: { color: '#8A2BE2', fontSize: 42, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
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
    flex: 1, // Takes up remaining space
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