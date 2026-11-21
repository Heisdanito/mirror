import { useState } from 'react';
import {
  ActionSheetIOS, ActivityIndicator, Alert, Image, Linking, Modal, Platform, Pressable,
  ScrollView, StyleSheet, Text, useWindowDimensions, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { importPhoto, MAX_PHOTOS, photoUri } from '@/lib/photos';
import { usePalette } from '@/lib/settings';
import { tap } from './ui';

/** Editable row of photo thumbnails with an "Add photo" tile (camera or library). */
export function PhotoPicker({ value, onChange }: { value: string[]; onChange: (names: string[]) => void }) {
  const p = usePalette();
  const [busy, setBusy] = useState(false);
  const [viewing, setViewing] = useState<number | null>(null);
  const remaining = MAX_PHOTOS - value.length;

  const addFrom = async (source: 'camera' | 'library') => {
    try {
      let result: ImagePicker.ImagePickerResult;
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(
            'Camera access is off',
            'To take photos for your journal, allow camera access for Mirror in Settings.',
            [{ text: 'Not now', style: 'cancel' }, ...(perm.canAskAgain ? [] : [{ text: 'Open Settings', onPress: () => Linking.openSettings() }])],
          );
          return;
        }
        result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsMultipleSelection: true,
          selectionLimit: remaining,
          quality: 0.7,
        });
      }
      if (result.canceled || !result.assets?.length) return;
      setBusy(true);
      const names: string[] = [];
      for (const a of result.assets.slice(0, remaining)) names.push(await importPhoto(a.uri));
      onChange([...value, ...names]);
    } catch {
      Alert.alert('Could not add photo', 'Something went wrong while saving that photo. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const chooseSource = () => {
    tap();
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Take photo', 'Choose from library', 'Cancel'], cancelButtonIndex: 2 },
        (i) => (i === 0 ? addFrom('camera') : i === 1 ? addFrom('library') : undefined),
      );
    } else {
      Alert.alert('Add a photo', undefined, [
        { text: 'Take photo', onPress: () => addFrom('camera') },
        { text: 'Choose from library', onPress: () => addFrom('library') },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const remove = (name: string) => {
    tap();
    onChange(value.filter((n) => n !== name));
  };

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
        {value.map((n, i) => (
          <View key={n}>
            <Pressable onPress={() => setViewing(i)} accessibilityLabel={`Photo ${i + 1}, tap to view`}>
              <Image source={{ uri: photoUri(n) }} style={[styles.thumb, { backgroundColor: p.surfaceAlt }]} />
            </Pressable>
            <Pressable onPress={() => remove(n)} hitSlop={8} accessibilityLabel={`Remove photo ${i + 1}`} style={[styles.remove, { backgroundColor: p.ink }]}>
              <MaterialCommunityIcons name="close" size={14} color={p.bg} />
            </Pressable>
          </View>
        ))}
        {remaining > 0 && (
          <Pressable
            onPress={chooseSource}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Add photo"
            style={({ pressed }) => [styles.thumb, styles.add, { borderColor: p.border, backgroundColor: p.surface }, pressed && { opacity: 0.7 }]}
          >
            {busy ? (
              <ActivityIndicator color={p.accent} />
            ) : (
              <>
                <MaterialCommunityIcons name="camera-plus-outline" size={26} color={p.accent} />
                <Text style={{ color: p.muted, fontSize: 12, fontWeight: '600' }}>{value.length ? 'Add more' : 'Add photo'}</Text>
              </>
            )}
          </Pressable>
        )}
      </ScrollView>
      <Text style={{ color: p.faint, fontSize: 12, marginTop: 6 }}>
        {value.length}/{MAX_PHOTOS} photos · saved privately on this phone
      </Text>
      <PhotoViewer names={value} index={viewing} onClose={() => setViewing(null)} />
    </View>
  );
}

/** Read-only grid; tap to open full screen. */
export function PhotoGallery({ names }: { names: string[] }) {
  const p = usePalette();
  const [viewing, setViewing] = useState<number | null>(null);
  if (!names.length) return null;
  const single = names.length === 1;
  return (
    <View style={styles.grid}>
      {names.map((n, i) => (
        <Pressable key={n} onPress={() => setViewing(i)} style={single ? styles.single : styles.cell} accessibilityLabel={`Open photo ${i + 1}`}>
          <Image source={{ uri: photoUri(n) }} style={[StyleSheet.absoluteFill, { borderRadius: 16, backgroundColor: p.surfaceAlt }]} />
        </Pressable>
      ))}
      <PhotoViewer names={names} index={viewing} onClose={() => setViewing(null)} />
    </View>
  );
}

export function PhotoViewer({ names, index, onClose }: { names: string[]; index: number | null; onClose: () => void }) {
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  return (
    <Modal visible={index !== null} transparent animationType="fade" onRequestClose={onClose} onShow={() => setPage(index ?? 0)} statusBarTranslucent>
      <View style={styles.viewerBg}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.viewerTop}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>{names.length > 1 ? `${page + 1} / ${names.length}` : ''}</Text>
            <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close photo">
              <MaterialCommunityIcons name="close" size={28} color="#fff" />
            </Pressable>
          </View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: (index ?? 0) * width, y: 0 }}
            onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
          >
            {names.map((n) => (
              <Image key={n} source={{ uri: photoUri(n) }} resizeMode="contain" style={{ width, height: '100%' }} />
            ))}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  strip: { gap: 10, paddingTop: 6, paddingRight: 6 },
  thumb: { width: 92, height: 92, borderRadius: 16 },
  add: { borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 },
  remove: { position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  single: { width: '100%', aspectRatio: 4 / 3 },
  cell: { width: '48.8%', aspectRatio: 1 },
  viewerBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
  viewerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10 },
});
