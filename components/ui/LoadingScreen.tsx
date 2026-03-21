import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { DashboardSkeleton } from './Skeleton';

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <DashboardSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
