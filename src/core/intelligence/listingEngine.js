// =============================================================================
// KAELO LISTING INTELLIGENCE & CONVERSATION ENGINE
// =============================================================================
// Robust multi-stage voice listing creator adhering to:
// Listen First → Understand Second → Confirm Third → Execute Only on Approval
//
// States:
// IDLE → LISTENING → TRANSCRIBING → INTERPRETING → DRAFTING →
// CLARIFYING (if required fields missing) → AWAITING_CONFIRMATION →
// EXECUTING → SUCCESS / FAILURE
// =============================================================================

import { generateId } from '../../utils/helpers.js';

export const LISTING_STATES = {
  IDLE: 'IDLE',
  LISTENING: 'LISTENING',
  TRANSCRIBING: 'TRANSCRIBING',
  INTERPRETING: 'INTERPRETING',
  DRAFTING: 'DRAFTING',
  CLARIFYING: 'CLARIFYING',
  AWAITING_CONFIRMATION: 'AWAITING_CONFIRMATION',
  EXECUTING: 'EXECUTING',
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE'
};

export const LISTING_SCHEMA = {
  requiredFields: ['property_type', 'location', 'bedrooms', 'price'],
  optionalFields: [
    'bathrooms',
    'amenities',
    'currency',
    'pricing_unit',
    'availability',
    'booking_conditions',
    'description'
  ],
  defaults: {
    currency: 'NGN',
    pricing_unit: 'night',
    bathrooms: 2,
    availability: 'immediate'
  }
};

// Known Nigerian Locations & Global Real Estate Markets
const COMMON_LOCATIONS = [
  'Lekki', 'Lekki Phase 1', 'Victoria Island', 'Ikoyi', 'Ikeja', 'Ajah',
  'Banana Island', 'Epe', 'Maryland', 'Surulere', 'Yaba', 'Magodo',
  'Abuja', 'Maitama', 'Wuse', 'Garki', 'Asokoro', 'Lagos', 'Port Harcourt'
];

// Known Common Amenities
const AMENITY_KEYWORDS = [
  { match: /(?:swimming\s+)?pool/i, name: 'swimming pool' },
  { match: /(?:24-?hour|24hr|twenty-?four\s+hours?)\s+(?:electricity|power|light)/i, name: '24-hour electricity' },
  { match: /gym|fitness\s+center/i, name: 'gym' },
  { match: /smart\s+tv/i, name: 'smart TV' },
  { match: /wi-?fi|internet|high-?speed\s+internet/i, name: 'high-speed WiFi' },
  { match: /parking|car\s+park/i, name: 'dedicated parking' },
  { match: /air\s+conditioning|ac/i, name: 'air conditioning' },
  { match: /security|security\s+guard|cctv/i, name: '24/7 security' },
  { match: /balcony|terrace/i, name: 'balcony' },
  { match: /ocean\s+view|water\s+view/i, name: 'water view' },
  { match: /chef|kitchen/i, name: 'fully equipped kitchen' }
];

export class ListingEngine {
  /**
   * Helper: Parse words representing numbers (e.g., "one hundred and eighty thousand" -> 180000)
   */
  static parseWordNumber(text) {
    if (!text) return null;
    const lower = text.toLowerCase();

    // Direct digit extraction with comma or k suffix (e.g., "180,000", "₦180000", "180k")
    const digitMatch = lower.match(/(?:₦|ngn|naira|\$)?\s*(\d{1,3}(?:,\d{3})+|\d+)\s*(k|thousand|million)?/i);
    if (digitMatch) {
      let num = parseInt(digitMatch[1].replace(/,/g, ''), 10);
      const mult = (digitMatch[2] || '').toLowerCase();
      if (mult === 'k' || mult === 'thousand') num *= 1000;
      if (mult === 'million') num *= 1000000;
      return num;
    }

    // Spoken number words
    const words = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
      'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
      'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19,
      'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
      'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90
    };

    let total = 0;
    let current = 0;

    const tokens = lower.split(/[\s-]+/);
    let matchedAny = false;

    for (const rawToken of tokens) {
      const token = rawToken.replace(/[^\w]/g, '').toLowerCase();
      if (!token) continue;

      if (words[token] !== undefined) {
        current += words[token];
        matchedAny = true;
      } else if (token === 'hundred') {
        current = (current === 0 ? 1 : current) * 100;
        matchedAny = true;
      } else if (token === 'thousand') {
        current = (current === 0 ? 1 : current) * 1000;
        total += current;
        current = 0;
        matchedAny = true;
      } else if (token === 'million') {
        current = (current === 0 ? 1 : current) * 1000000;
        total += current;
        current = 0;
        matchedAny = true;
      }
    }
    total += current;

    return matchedAny && total > 0 ? total : null;
  }

  /**
   * Extracts location from utterance
   */
  static extractLocation(text) {
    if (!text) return null;
    for (const loc of COMMON_LOCATIONS) {
      const regex = new RegExp(`\\b${loc}\\b`, 'i');
      if (regex.test(text)) {
        return loc;
      }
    }

    // Match "in <Proper Noun>" pattern
    const inMatch = text.match(/\bin\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/);
    if (inMatch && !['January', 'February', 'December', 'Nigeria', 'Lagos'].includes(inMatch[1])) {
      return inMatch[1];
    }

    return null;
  }

  /**
   * Extracts property type and bedroom count
   */
  static extractPropertyDetails(text) {
    const lower = text.toLowerCase();
    let bedrooms = null;
    let property_type = null;

    // Bedroom count patterns
    const bedMatch = lower.match(/(\d+|one|two|three|four|five|six|seven|eight)\s*(?:-|\s*)bedroom/i);
    if (bedMatch) {
      const wordMap = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
      bedrooms = wordMap[bedMatch[1].toLowerCase()] || parseInt(bedMatch[1], 10);
    } else if (lower.includes('studio')) {
      bedrooms = 1;
      property_type = 'studio apartment';
    }

    // Property Type
    if (lower.includes('apartment')) {
      property_type = bedrooms ? `${bedrooms}-bedroom apartment` : 'apartment';
    } else if (lower.includes('flat')) {
      property_type = bedrooms ? `${bedrooms}-bedroom flat` : 'flat';
    } else if (lower.includes('duplex')) {
      property_type = bedrooms ? `${bedrooms}-bedroom duplex` : 'duplex';
    } else if (lower.includes('penthouse')) {
      property_type = bedrooms ? `${bedrooms}-bedroom penthouse` : 'penthouse';
    } else if (lower.includes('villa')) {
      property_type = bedrooms ? `${bedrooms}-bedroom villa` : 'villa';
    } else if (bedrooms) {
      property_type = `${bedrooms}-bedroom property`;
    }

    return { bedrooms, property_type };
  }

  /**
   * Extracts price including multi-step self-corrections
   * e.g., "₦150,000 per night. Actually, make that ₦180,000" -> 180000
   * e.g., "two hundred thousand per night. Sorry, one hundred and eighty thousand" -> 180000
   */
  static extractPrice(text) {
    if (!text) return null;

    // Remove bedroom specifications so bedroom counts (e.g. "two-bedroom") are not confused with price
    const textWithoutBedrooms = text.replace(/(?:\d+|one|two|three|four|five|six|seven|eight)\s*(?:-|\s*)bedroom/gi, '');

    // Check for explicit correction markers
    const correctionSplit = textWithoutBedrooms.split(/(?:actually|sorry|i mean|change that to|change price to|change to|make that|make it|not that one|instead of)[,:]?\s*/i);

    if (correctionSplit.length > 1) {
      // Evaluate the segments from last to first
      for (let i = correctionSplit.length - 1; i >= 0; i--) {
        const seg = correctionSplit[i];
        const parsed = this.parseWordNumber(seg);
        if (parsed && (parsed >= 1000 || /(?:₦|naira|ngn|\$|per\s+night|\/night)/i.test(seg))) {
          return parsed;
        }
      }
    }

    // Single statement price extraction
    const parsed = this.parseWordNumber(textWithoutBedrooms);
    if (parsed && (parsed >= 1000 || /(?:₦|naira|ngn|\$|per\s+night|\/night|price\s+(?:is|of))/i.test(textWithoutBedrooms))) {
      return parsed;
    }

    return null;
  }

  /**
   * Extracts amenities present in text
   */
  static extractAmenities(text, existingAmenities = []) {
    const amenities = new Set(existingAmenities);
    for (const item of AMENITY_KEYWORDS) {
      if (item.match.test(text)) {
        amenities.add(item.name);
      }
    }
    return Array.from(amenities);
  }

  /**
   * Extracts availability and booking conditions
   */
  static extractAvailability(text) {
    const lower = text.toLowerCase();
    let availability = null;
    let booking_conditions = null;

    if (lower.includes('weekend bookings') || lower.includes('weekends only') || lower.includes('for weekend')) {
      availability = 'weekends';
      booking_conditions = 'available for weekend bookings';
    } else if (lower.includes('minimum 2 nights') || lower.includes('min 2 nights')) {
      booking_conditions = 'minimum 2 nights booking';
    } else if (lower.includes('immediate') || lower.includes('available now')) {
      availability = 'immediate';
    }

    return { availability, booking_conditions };
  }

  /**
   * STAGE B: INTERPRET
   * Interprets natural speech (including corrections) into a structured listing draft.
   *
   * @param {string} text - User's complete transcript
   * @param {Object|null} baseDraft - Prior draft if editing or continuing
   * @returns {Object} Structured listing draft
   */
  static interpret(text, baseDraft = null) {
    const draft = baseDraft ? { ...baseDraft } : {
      id: generateId('list_'),
      property_type: null,
      title: null,
      location: null,
      bedrooms: null,
      bathrooms: LISTING_SCHEMA.defaults.bathrooms,
      price: null,
      currency: LISTING_SCHEMA.defaults.currency,
      pricing_unit: LISTING_SCHEMA.defaults.pricing_unit,
      amenities: [],
      availability: LISTING_SCHEMA.defaults.availability,
      booking_conditions: null,
      status: LISTING_STATES.DRAFTING,
      history: [],
      createdAt: new Date().toISOString()
    };

    // Store utterance in history
    draft.history.push({ text, timestamp: new Date().toISOString() });

    // 1. Property Details
    const propDetails = this.extractPropertyDetails(text);
    if (propDetails.bedrooms !== null) draft.bedrooms = propDetails.bedrooms;
    if (propDetails.property_type !== null) draft.property_type = propDetails.property_type;

    // 2. Location (check for location corrections e.g. "change the location to Victoria Island")
    const locCorrectionMatch = text.match(/(?:change\s+the\s+location\s+to|location\s+is|in)\s+([A-Za-z\s]+?)(?:\.|$|,|\s+and)/i);
    let extractedLoc = null;
    if (locCorrectionMatch) {
      extractedLoc = this.extractLocation(locCorrectionMatch[1]) || locCorrectionMatch[1].trim();
    } else {
      extractedLoc = this.extractLocation(text);
    }
    if (extractedLoc) draft.location = extractedLoc;

    // 3. Price (handles "Actually make that ₦180,000" and "Sorry, ₦180,000")
    const extractedPrice = this.extractPrice(text);
    if (extractedPrice !== null) draft.price = extractedPrice;

    // 4. Amenities
    draft.amenities = this.extractAmenities(text, draft.amenities);

    // 5. Availability & Booking conditions
    const availDetails = this.extractAvailability(text);
    if (availDetails.availability) draft.availability = availDetails.availability;
    if (availDetails.booking_conditions) draft.booking_conditions = availDetails.booking_conditions;

    // 6. Generate Title
    if (draft.property_type && draft.location) {
      draft.title = `${draft.property_type} in ${draft.location}`;
    } else if (draft.property_type) {
      draft.title = draft.property_type;
    }

    return draft;
  }

  /**
   * STAGE C: CHECK COMPLETENESS
   * Compares the draft against the required listing schema.
   *
   * @param {Object} draft - The current draft
   * @returns {Object} { isComplete, missingFields, clarifyingQuestion }
   */
  static checkCompleteness(draft) {
    const missing = [];

    if (!draft.property_type) missing.push('property_type');
    if (!draft.location) missing.push('location');
    if (!draft.bedrooms) missing.push('bedrooms');
    if (!draft.price) missing.push('price');

    if (missing.length === 0) {
      return {
        isComplete: true,
        missingFields: [],
        clarifyingQuestion: null
      };
    }

    // Ask focused, conversational questions for missing fields
    let clarifyingQuestion = '';
    if (missing.includes('price')) {
      const locNote = draft.location ? ` in ${draft.location}` : '';
      const typeNote = draft.property_type || 'property';
      clarifyingQuestion = `I've got the ${typeNote}${locNote} details. What nightly price should I use?`;
    } else if (missing.includes('location')) {
      clarifyingQuestion = `What location is this ${draft.property_type || 'property'} located in?`;
    } else if (missing.includes('bedrooms')) {
      clarifyingQuestion = `How many bedrooms does this property have?`;
    } else if (missing.includes('property_type')) {
      clarifyingQuestion = `What type of property is this (e.g. apartment, duplex, or villa)?`;
    }

    return {
      isComplete: false,
      missingFields: missing,
      clarifyingQuestion
    };
  }

  /**
   * STAGE D: READ BACK THE LISTING
   * Summarizes the intended listing naturally and concisely from the actual draft.
   *
   * @param {Object} draft - Structured draft
   * @returns {string} Natural spoken read-back summary
   */
  static generateReadBack(draft) {
    const priceFormatted = draft.price ? `₦${draft.price.toLocaleString()}` : 'unspecified';
    const amenitiesList = draft.amenities && draft.amenities.length > 0
      ? `, with ${draft.amenities.slice(0, 4).join(', ')}`
      : '';
    const bookingNote = draft.booking_conditions ? `, with ${draft.booking_conditions}` : '';

    return `Alright, I've got your listing. It's a ${draft.property_type || 'property'} in ${draft.location}, priced at ${priceFormatted} per ${draft.pricing_unit}${amenitiesList}${bookingNote}. Is everything correct? Should I create the listing?`;
  }

  /**
   * STAGE E & F: PROCESS CONVERSATION TURN
   * Main state machine turn handler.
   *
   * @param {string} text - User utterance
   * @param {Object|null} activeDraft - Active listing draft in context
   * @param {Object} services - External dependencies (storage, backend API, audit)
   * @returns {Object} Result { aiResponseText, spokenText, updatedDraft, status, actionToExecute }
   */
  static processTurn(text, activeDraft = null, services = {}) {
    const lower = (text || '').toLowerCase().trim();

    // -------------------------------------------------------------------------
    // 0. SILENCE / EMPTY INPUT CHECK (Test 8) - Silence never implies consent
    // -------------------------------------------------------------------------
    if (!lower) {
      return {
        aiResponseText: "I'm still listening. Whenever you're ready, let me know if you want to create this listing or make changes.",
        spokenText: "I'm still listening.",
        updatedDraft: activeDraft,
        status: activeDraft ? activeDraft.status : LISTING_STATES.IDLE,
        actionToExecute: null
      };
    }

    // -------------------------------------------------------------------------
    // 1. REJECTION / CANCELLATION CHECK (Test 5)
    // -------------------------------------------------------------------------
    if (
      lower === 'no' ||
      lower === "no, that's wrong" ||
      lower === "that's wrong" ||
      lower === 'cancel' ||
      lower === 'stop' ||
      lower === 'never mind' ||
      lower === "don't create it" ||
      lower.startsWith('cancel this')
    ) {
      return {
        aiResponseText: "Understood. I cancelled this draft and won't create any listing.",
        spokenText: "Cancelled. No listing was created.",
        updatedDraft: null,
        status: LISTING_STATES.IDLE,
        actionToExecute: { type: 'CANCEL_LISTING_DRAFT' },
        toast: { title: 'Draft Cancelled', message: 'No listing created.', type: 'info' }
      };
    }

    // -------------------------------------------------------------------------
    // 1.5. ALREADY SUBMITTED / IDEMPOTENCY CHECK (Test 9)
    // -------------------------------------------------------------------------
    if (activeDraft && (activeDraft.isSubmitted || activeDraft.status === 'published' || activeDraft.status === LISTING_STATES.SUCCESS)) {
      return {
        aiResponseText: "This listing is already submitted! Opening your listing details.",
        spokenText: "This listing is already submitted.",
        updatedDraft: activeDraft,
        status: LISTING_STATES.SUCCESS,
        actionToExecute: null
      };
    }

    // -------------------------------------------------------------------------
    // 2. ACTIVE CONFIRMATION STATE (Test 4, Test 6, Test 7)
    // -------------------------------------------------------------------------
    if (activeDraft && activeDraft.status === LISTING_STATES.AWAITING_CONFIRMATION) {
      // A. Check for corrections during confirmation (Test 6)
      // e.g. "No, make it ₦180,000 and change the location to Victoria Island"
      const isCorrectionTurn = 
        lower.includes('make it') || 
        lower.includes('change') || 
        lower.includes('instead') || 
        lower.includes('sorry') || 
        lower.includes('actually') ||
        lower.includes('not lekki') ||
        lower.includes('wrong price');

      if (isCorrectionTurn) {
        const updated = this.interpret(text, activeDraft);
        const deltas = [];

        if (updated.price !== activeDraft.price) {
          deltas.push(`the price to ₦${updated.price.toLocaleString()} per night`);
        }
        if (updated.location !== activeDraft.location) {
          deltas.push(`the location to ${updated.location}`);
        }
        if (updated.bedrooms !== activeDraft.bedrooms) {
          deltas.push(`it to ${updated.bedrooms} bedrooms`);
        }

        const deltaMessage = deltas.length > 0 
          ? `I've changed ${deltas.join(' and ')}.` 
          : "I've updated the listing details.";

        const newPrompt = `Done. ${deltaMessage} Is everything correct now? Should I create it?`;

        updated.status = LISTING_STATES.AWAITING_CONFIRMATION;

        return {
          aiResponseText: newPrompt,
          spokenText: newPrompt,
          updatedDraft: updated,
          status: LISTING_STATES.AWAITING_CONFIRMATION,
          actionToExecute: { type: 'UPDATE_LISTING_DRAFT', payload: updated }
        };
      }

      // B. Explicit Approval Check (Test 4)
      const isApproved = 
        lower === 'yes' ||
        lower === 'yes, create it' ||
        lower === 'yes create it' ||
        lower === "that's correct" ||
        lower === 'thats correct' ||
        lower === 'confirm' ||
        lower === 'go ahead' ||
        lower === 'create it' ||
        lower === 'looks good' ||
        lower === 'proceed';

      if (isApproved) {
        // Idempotency check: prevent duplicate submissions (Test 9)
        if (activeDraft.isSubmitting || activeDraft.isSubmitted) {
          return {
            aiResponseText: "This listing is already submitted! Opening your listing details.",
            spokenText: "This listing is already submitted.",
            updatedDraft: activeDraft,
            status: LISTING_STATES.SUCCESS,
            actionToExecute: null
          };
        }

        // Simulate backend submission check (Test 10)
        if (services.simulateBackendFailure) {
          return {
            aiResponseText: "I couldn't create the listing due to a network error. Your draft has been preserved so you can retry.",
            spokenText: "Listing creation failed due to a server error. Your draft is saved.",
            updatedDraft: { ...activeDraft, status: LISTING_STATES.FAILURE },
            status: LISTING_STATES.FAILURE,
            actionToExecute: null,
            toast: { title: 'Submission Failed', message: 'Draft preserved. Tap to retry.', type: 'warning' }
          };
        }

        const finalizedListing = {
          ...activeDraft,
          id: activeDraft.id || generateId('list_'),
          status: 'published',
          publishedAt: new Date().toISOString(),
          isSubmitting: false,
          isSubmitted: true
        };

        const successMessage = `Success! Your listing for ${finalizedListing.title} is live at ₦${finalizedListing.price.toLocaleString()}/night.`;

        return {
          aiResponseText: successMessage,
          spokenText: `Created! Your listing for ${finalizedListing.title} is live.`,
          updatedDraft: null,
          createdListing: finalizedListing,
          status: LISTING_STATES.SUCCESS,
          actionToExecute: {
            type: 'CREATE_LISTING_SUCCESS',
            payload: finalizedListing
          },
          toast: {
            title: 'Listing Published',
            message: `${finalizedListing.title} · ₦${finalizedListing.price?.toLocaleString()}`,
            type: 'achievement'
          }
        };
      }

      // C. Ambiguous Response Check (Test 7)
      return {
        aiResponseText: "Would you like me to create the listing, or would you like to change something first?",
        spokenText: "Should I create the listing, or change something first?",
        updatedDraft: activeDraft,
        status: LISTING_STATES.AWAITING_CONFIRMATION,
        actionToExecute: null
      };
    }

    // -------------------------------------------------------------------------
    // 3. CLARIFYING STATE (Missing Required Fields, Test 3)
    // -------------------------------------------------------------------------
    if (activeDraft && activeDraft.status === LISTING_STATES.CLARIFYING) {
      // User provided the missing information
      const updatedDraft = this.interpret(text, activeDraft);
      const completeness = this.checkCompleteness(updatedDraft);

      if (!completeness.isComplete) {
        return {
          aiResponseText: completeness.clarifyingQuestion,
          spokenText: completeness.clarifyingQuestion,
          updatedDraft,
          status: LISTING_STATES.CLARIFYING,
          actionToExecute: { type: 'UPDATE_LISTING_DRAFT', payload: updatedDraft }
        };
      }

      // Now complete! Move to read-back & awaiting confirmation
      updatedDraft.status = LISTING_STATES.AWAITING_CONFIRMATION;
      const readBack = this.generateReadBack(updatedDraft);

      return {
        aiResponseText: readBack,
        spokenText: readBack,
        updatedDraft,
        status: LISTING_STATES.AWAITING_CONFIRMATION,
        actionToExecute: { type: 'UPDATE_LISTING_DRAFT', payload: updatedDraft }
      };
    }

    // -------------------------------------------------------------------------
    // 4. NEW LISTING INITIATION (Test 1, Test 2, Test 3)
    // -------------------------------------------------------------------------
    const draft = this.interpret(text, activeDraft);
    const completeness = this.checkCompleteness(draft);

    if (!completeness.isComplete) {
      // Required field missing (Test 3)
      draft.status = LISTING_STATES.CLARIFYING;
      return {
        aiResponseText: completeness.clarifyingQuestion,
        spokenText: completeness.clarifyingQuestion,
        updatedDraft: draft,
        status: LISTING_STATES.CLARIFYING,
        actionToExecute: { type: 'UPDATE_LISTING_DRAFT', payload: draft }
      };
    }

    // All required fields present! Read back and await explicit confirmation (Test 4)
    draft.status = LISTING_STATES.AWAITING_CONFIRMATION;
    const readBack = this.generateReadBack(draft);

    return {
      aiResponseText: readBack,
      spokenText: readBack,
      updatedDraft: draft,
      status: LISTING_STATES.AWAITING_CONFIRMATION,
      actionToExecute: { type: 'UPDATE_LISTING_DRAFT', payload: draft }
    };
  }
}
