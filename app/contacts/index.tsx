import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AccessibleButton } from '../../src/components/common/AccessibleButton';
import { AccessibleText } from '../../src/components/common/AccessibleText';
import { Card } from '../../src/components/common/Card';
import { ScreenReaderAnnouncement } from '../../src/components/accessibility/ScreenReaderAnnouncement';
import { ContactService, Contact } from '../../src/services/contacts/contactService';
import { HapticsService } from '../../src/services/device/haptics';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

export default function ContactsScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [nameInput, setNameInput] = useState<string>('');
  const [addressInput, setAddressInput] = useState<string>('');
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [announcement, setAnnouncement] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  const loadContacts = useCallback(async () => {
    try {
      setIsLoading(true);
      const list = await ContactService.getContacts();
      setContacts(list);
    } catch {
      setAnnouncement('Could not load contacts.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) loadContacts();
    });
    return () => {
      isMounted = false;
    };
  }, [loadContacts]);

  const handleAddContact = async () => {
    setFormError(null);
    if (!nameInput.trim()) {
      setFormError('Please enter a contact name.');
      return;
    }
    if (!addressInput.trim()) {
      setFormError('Please enter a Stellar address.');
      return;
    }

    try {
      setIsAdding(true);
      const added = await ContactService.addContact(nameInput, addressInput);
      await HapticsService.notificationSuccess();
      setAnnouncement(`Contact ${added.name} successfully added.`);
      setNameInput('');
      setAddressInput('');
      await loadContacts();
    } catch (err: unknown) {
      await HapticsService.notificationError();
      const msg = err instanceof Error ? err.message : 'Failed to add contact';
      setFormError(msg);
      setAnnouncement(`Error adding contact: ${msg}`);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = (contact: Contact) => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await ContactService.deleteContact(contact.id);
            await HapticsService.impactLight();
            setAnnouncement(`Deleted ${contact.name}.`);
            await loadContacts();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenReaderAnnouncement message={announcement} />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <AccessibleButton
            label="← Back to Home"
            accessibilityHint="Navigates back to the main voice screen"
            variant="secondary"
            onPress={() => router.back()}
            style={styles.backBtn}
          />
          <AccessibleText variant="title" style={styles.title}>
            Verified Contacts
          </AccessibleText>
          <AccessibleText variant="body" style={styles.subtitle}>
            Saved nicknames linked to validated Stellar addresses for voice identification.
          </AccessibleText>
        </View>

        {/* Add Contact Card */}
        <Card style={styles.card}>
          <AccessibleText variant="label" style={styles.cardTitle}>
            ADD NEW CONTACT
          </AccessibleText>

          <AccessibleText variant="caption" style={styles.inputLabel}>
            Contact Nickname or Name
          </AccessibleText>
          <TextInput
            style={styles.input}
            placeholder="e.g. Amina or David Okafor"
            placeholderTextColor={colors.brandSecondaryText}
            value={nameInput}
            onChangeText={setNameInput}
            accessibilityLabel="Contact name input"
            accessibilityHint="Enter the person's name or nickname for voice commands"
          />

          <AccessibleText variant="caption" style={styles.inputLabel}>
            Stellar Public Address (G...)
          </AccessibleText>
          <TextInput
            style={[styles.input, styles.monoInput]}
            placeholder="G..."
            placeholderTextColor={colors.brandSecondaryText}
            value={addressInput}
            onChangeText={setAddressInput}
            autoCapitalize="characters"
            autoCorrect={false}
            accessibilityLabel="Stellar public key input"
            accessibilityHint="Enter the 56 character Stellar G-address"
          />

          {formError ? (
            <AccessibleText variant="caption" style={styles.errorText}>
              {formError}
            </AccessibleText>
          ) : null}

          <AccessibleButton
            label={isAdding ? 'Saving Contact...' : 'Save Contact'}
            accessibilityHint="Validates address and saves to your verified contact list"
            variant="primary"
            onPress={handleAddContact}
            disabled={isAdding}
            style={styles.saveBtn}
          />
        </Card>

        {/* Contact List */}
        <View style={styles.listSection}>
          <AccessibleText variant="label" style={styles.listSectionTitle}>
            SAVED CONTACTS ({contacts.length})
          </AccessibleText>

          {isLoading ? (
            <ActivityIndicator size="large" color={colors.brandYellow} style={styles.loader} />
          ) : contacts.length === 0 ? (
            <Card style={styles.emptyCard}>
              <AccessibleText variant="body" style={styles.emptyText}>
                No verified contacts saved yet. Add a contact above or ask the assistant: &quot;Add contact David G...&quot;.
              </AccessibleText>
            </Card>
          ) : (
            contacts.map((contact) => (
              <Card key={contact.id} style={styles.contactCard}>
                <View style={styles.contactInfo}>
                  <AccessibleText variant="subtitle" style={styles.contactName}>
                    {contact.name}
                  </AccessibleText>
                  <AccessibleText variant="caption" style={styles.contactAddress}>
                    {contact.address.slice(0, 10)}...{contact.address.slice(-10)}
                  </AccessibleText>
                </View>
                <AccessibleButton
                  label="Delete"
                  accessibilityHint={`Deletes ${contact.name} from contacts`}
                  variant="danger"
                  onPress={() => handleDelete(contact)}
                  style={styles.deleteBtn}
                />
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.brandMilky,
  },
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.md,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 26,
    color: colors.brandBlack,
    fontWeight: 'bold',
  },
  subtitle: {
    color: colors.brandSecondaryText,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.brandWhite,
    borderColor: colors.brandBorder,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    color: colors.brandBlack,
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },
  inputLabel: {
    color: colors.brandSecondaryText,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.brandMilky,
    borderWidth: 1,
    borderColor: colors.brandBorder,
    borderRadius: 8,
    padding: spacing.md,
    color: colors.brandBlack,
    fontSize: 16,
    minHeight: 48,
  },
  monoInput: {
    fontSize: 13,
    letterSpacing: 0.5,
  },
  saveBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.brandYellow,
  },
  errorText: {
    color: colors.danger,
    marginTop: spacing.sm,
  },
  listSection: {
    marginTop: spacing.xs,
  },
  listSectionTitle: {
    color: colors.brandSecondaryText,
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },
  loader: {
    marginVertical: spacing.xl,
  },
  emptyCard: {
    backgroundColor: colors.brandWhite,
    borderColor: colors.brandBorder,
    borderWidth: 1,
  },
  emptyText: {
    color: colors.brandSecondaryText,
    textAlign: 'center',
    lineHeight: 22,
  },
  contactCard: {
    backgroundColor: colors.brandWhite,
    borderColor: colors.brandBorder,
    borderWidth: 1,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  contactName: {
    color: colors.brandBlack,
    fontWeight: 'bold',
    fontSize: 18,
  },
  contactAddress: {
    color: colors.brandSecondaryText,
    marginTop: spacing.xs,
    fontFamily: 'monospace',
  },
  deleteBtn: {
    minWidth: 80,
  },
});
