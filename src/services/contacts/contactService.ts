import { LocalPreferencesService } from '../storage/localStorage';
import { validateStellarAddress } from '../stellar/validation';

export interface Contact {
  id: string;
  name: string;
  address: string;
  createdAt: number;
}

const STORAGE_KEY = 'verified_contacts';

/**
 * Verified Contact Management Service
 * Manages trusted nicknames associated with validated Stellar addresses.
 */
export class ContactService {
  /**
   * Retrieve all saved contacts
   */
  public static async getContacts(): Promise<Contact[]> {
    return LocalPreferencesService.getPreference<Contact[]>(STORAGE_KEY, []);
  }

  /**
   * Save or add a new verified contact
   */
  public static async addContact(name: string, address: string): Promise<Contact> {
    const trimmedName = name.trim();
    const trimmedAddress = address.trim();

    if (!trimmedName || trimmedName.length < 2) {
      throw new Error('Contact name must be at least 2 characters long.');
    }

    // Validate Stellar address
    const recipientValidation = validateStellarAddress(trimmedAddress);
    if (!recipientValidation.isValid) {
      throw new Error(`Invalid Stellar address: ${recipientValidation.error || 'Invalid format'}`);
    }

    const contacts = await this.getContacts();

    // Check for exact duplicate address
    const existing = contacts.find(
      (c) => c.address.toLowerCase() === trimmedAddress.toLowerCase()
    );
    if (existing) {
      throw new Error(`Contact with address ${trimmedAddress} already exists as "${existing.name}".`);
    }

    const newContact: Contact = {
      id: `contact_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: trimmedName,
      address: trimmedAddress,
      createdAt: Date.now(),
    };

    contacts.push(newContact);
    await LocalPreferencesService.setPreference(STORAGE_KEY, contacts);
    return newContact;
  }

  /**
   * Search contacts by exact or fuzzy name match
   */
  public static async findContacts(query: string): Promise<Contact[]> {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    const contacts = await this.getContacts();

    // 1. Exact match
    const exactMatches = contacts.filter(
      (c) => c.name.toLowerCase() === trimmed
    );
    if (exactMatches.length > 0) return exactMatches;

    // 2. Starts with / prefix match
    const prefixMatches = contacts.filter((c) =>
      c.name.toLowerCase().startsWith(trimmed)
    );
    if (prefixMatches.length > 0) return prefixMatches;

    // 3. Contains match
    return contacts.filter((c) =>
      c.name.toLowerCase().includes(trimmed)
    );
  }

  /**
   * Delete a contact by ID
   */
  public static async deleteContact(id: string): Promise<void> {
    const contacts = await this.getContacts();
    const filtered = contacts.filter((c) => c.id !== id);
    await LocalPreferencesService.setPreference(STORAGE_KEY, filtered);
  }

  /**
   * Clear all contacts (primarily for tests)
   */
  public static async clearContacts(): Promise<void> {
    await LocalPreferencesService.removePreference(STORAGE_KEY);
  }
}
