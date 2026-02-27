import { Text, View } from 'react-native';

import styles from './index.styles.scss';

export default function HomeScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>My Habits</Text>
      <Text style={styles.subtitle}>Willkommen zu deiner ersten React Native App 👋</Text>
      <Text style={styles.text}>Nächster Schritt: Wir bauen jetzt gemeinsam eine Habit-Liste.</Text>
    </View>
  );
}
