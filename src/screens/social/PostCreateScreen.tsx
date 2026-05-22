import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';
import { useNavigation } from '@react-navigation/native';

export const PostCreateScreen: React.FC = () => {
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera access is needed to take photos. Please enable it in your device settings.');
      return false;
    }
    return true;
  };

  const requestGalleryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Photo library access is needed. Please enable it in your device settings.');
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open camera. Please try again.');
    }
  };

  const pickImage = async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open photo library. Please try again.');
    }
  };

  const handlePost = async () => {
    if (!content.trim() && !selectedImage) {
      Alert.alert('Error', 'Please enter content or select an image');
      return;
    }
    try {
      setLoading(true);
      await api.createPost(content, selectedImage);
      setContent('');
      setSelectedImage(null);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerEyebrow}>PRBOARD</Text>
          <Text style={styles.headerTitle}>Create Post</Text>
          <View style={styles.headerAccent} />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>WHAT'S YOUR PR?</Text>
          <TextInput
            style={styles.contentInput}
            placeholder="Share your lift, PR, or thoughts..."
            placeholderTextColor="#444"
            value={content}
            onChangeText={setContent}
            editable={!loading}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        {/* Image Preview */}
        {selectedImage && (
          <View style={styles.imagePreviewContainer}>
            <Image
              source={{ uri: selectedImage.uri }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.removeImageBtn}
              onPress={() => setSelectedImage(null)}
            >
              <Text style={styles.removeImageText}>✕ Remove</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.mediaButtons}>
          <TouchableOpacity
            style={[styles.mediaButton, loading && styles.buttonDisabled]}
            onPress={takePhoto}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.mediaButtonIcon}>📷</Text>
            <Text style={styles.mediaButtonText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mediaButton, loading && styles.buttonDisabled]}
            onPress={pickImage}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.mediaButtonIcon}>🖼️</Text>
            <Text style={styles.mediaButtonText}>Gallery</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.cancelButton, loading && styles.buttonDisabled]}
            onPress={() => navigation.goBack()}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.postButton, loading && styles.buttonDisabled]}
            onPress={handlePost}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.postButtonText}>Post It 🚀</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F' },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 20, paddingVertical: 24, gap: 20 },
  header: { marginBottom: 4 },
  headerEyebrow: { fontSize: 11, fontWeight: '800', color: '#FF4D4D', letterSpacing: 2.5, marginBottom: 4 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  headerAccent: { width: 40, height: 3, backgroundColor: '#FF4D4D', borderRadius: 2, marginTop: 6 },
  inputWrapper: { gap: 8 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#FF4D4D', letterSpacing: 1.5 },
  contentInput: {
    backgroundColor: '#1A1A1A', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: '#FFFFFF',
    borderWidth: 1, borderColor: '#2A2A2A', minHeight: 140,
  },
  imagePreviewContainer: {
    borderRadius: 12, overflow: 'hidden',
    position: 'relative',
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 10, right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  removeImageText: { color: '#FF4D4D', fontWeight: '700', fontSize: 13 },
  mediaButtons: { flexDirection: 'row', gap: 12 },
  mediaButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', backgroundColor: '#1A1A1A',
    borderRadius: 12, paddingVertical: 14, gap: 8,
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  mediaButtonIcon: { fontSize: 16 },
  mediaButtonText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  actionButtons: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelButton: {
    flex: 1, borderWidth: 1.5, borderColor: '#2A2A2A',
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  cancelButtonText: { color: '#555', fontSize: 15, fontWeight: '700' },
  postButton: {
    flex: 2, backgroundColor: '#FF4D4D', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
    shadowColor: '#FF4D4D', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  postButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
  buttonDisabled: { opacity: 0.5 },
});

export default PostCreateScreen;
