import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native'
import { useRouter } from 'expo-router'
import { MobileNavMenu } from '../components/navigation/MobileNavMenu'

export default function PricingScreen() {
  const router = useRouter()

  const handleContactSales = () => {
    // Open web pricing page or contact sales
    const pricingUrl = 'https://dooriq.ai/pricing'
    Linking.openURL(pricingUrl).catch((err) =>
      console.error('Failed to open pricing page:', err)
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pricing</Text>
        <Text style={styles.headerSubtitle}>Choose the plan that's right for you</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Flexible Pricing Plans</Text>
          <Text style={styles.infoText}>
            DoorIQ offers flexible pricing based on your team size. All plans include:
          </Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Unlimited practice sessions</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>AI-powered feedback</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Performance analytics</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Team management tools</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleContactSales}>
          <Text style={styles.primaryButtonText}>View Full Pricing</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => {
            const contactUrl = 'https://dooriq.ai/contact-sales'
            Linking.openURL(contactUrl).catch((err) =>
              console.error('Failed to open contact page:', err)
            )
          }}
        >
          <Text style={styles.secondaryButtonText}>Contact Sales</Text>
        </TouchableOpacity>

        <View style={styles.noteCard}>
          <Text style={styles.noteText}>
            💡 Pricing is based on the number of reps on your team. Contact us for custom enterprise solutions.
          </Text>
        </View>
      </ScrollView>
      <MobileNavMenu />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#888',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  infoCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 16,
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    fontSize: 18,
    color: '#10b981',
    fontWeight: '700',
  },
  featureText: {
    fontSize: 14,
    color: '#e2e8f0',
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#a855f7',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#a855f7',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 24,
  },
  secondaryButtonText: {
    color: '#a855f7',
    fontSize: 16,
    fontWeight: '600',
  },
  noteCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#a855f7',
  },
  noteText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
})

