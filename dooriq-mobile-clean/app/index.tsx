import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to DoorIQ</Text>
      <Text style={styles.subtitle}>AI-Powered Sales Training</Text>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => {
          // Navigate to training screen (we'll create this next)
          // router.push('/training');
          console.log('Start Training pressed');
        }}
      >
        <Text style={styles.buttonText}>Start Training</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Dark background
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#94A3B8',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#7C3AED', // DoorIQ purple
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

