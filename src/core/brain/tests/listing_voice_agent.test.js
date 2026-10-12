// =============================================================================
// KAELO VOICE AGENT ACCEPTANCE TEST SUITE (TESTS 1 – 12)
// Listing Creation, Speech Capture & Confirmation Flow
// =============================================================================

import { ListingEngine, LISTING_STATES } from '../../intelligence/listingEngine.js';
import { executeVoiceCommand } from '../../../utils/aiActionEngine.js';
import voiceService from '../../../utils/voiceService.js';

console.log('================================================================');
console.log('RUNNING KAELO VOICE AGENT ACCEPTANCE TESTS (1 – 12)');
console.log('Listen First → Understand Second → Confirm Third → Execute on Approval');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${message}`);
    failCount++;
  }
}

function createMockState(overrides = {}) {
  return {
    user: { id: 'u1', name: 'Fred', level: 4 },
    listings: [],
    activeListingDraft: null,
    tasks: [],
    goals: [],
    ...overrides
  };
}

// =============================================================================
// TEST 1: Long Request (Multi-clause, multi-sentence, full capture & self-correction)
// User: "I want to create a listing for a two-bedroom apartment in Lekki. The apartment
// has a swimming pool, 24-hour electricity, a gym, and a smart TV. The price is
// ₦150,000 per night. Actually, make that ₦180,000, and mention that it's available for weekend bookings."
// =============================================================================
console.log('--- TEST 1: Long Request with Multi-Clause Capture ---');
const state1 = createMockState();
const text1 = "I want to create a listing for a two-bedroom apartment in Lekki. The apartment has a swimming pool, 24-hour electricity, a gym, and a smart TV. The price is ₦150,000 per night. Actually, make that ₦180,000, and mention that it's available for weekend bookings.";

const turn1 = executeVoiceCommand(text1, state1, {});

assert(turn1.listingDraft !== null, 'Listing draft was created');
assert(turn1.listingDraft?.property_type === '2-bedroom apartment', 'Property type recognized as 2-bedroom apartment');
assert(turn1.listingDraft?.location === 'Lekki', 'Location recognized as Lekki');
assert(turn1.listingDraft?.bedrooms === 2, 'Bedrooms recognized as 2');
assert(turn1.listingDraft?.price === 180000, `Price captured with self-correction as ₦180,000 (was ${turn1.listingDraft?.price})`);
assert(turn1.listingDraft?.amenities?.includes('swimming pool'), 'Captured swimming pool amenity');
assert(turn1.listingDraft?.amenities?.includes('24-hour electricity'), 'Captured 24-hour electricity amenity');
assert(turn1.listingDraft?.amenities?.includes('gym'), 'Captured gym amenity');
assert(turn1.listingDraft?.amenities?.includes('smart TV'), 'Captured smart TV amenity');
assert(turn1.listingDraft?.availability === 'weekends', 'Captured weekend bookings availability');
assert(turn1.listingDraft?.status === LISTING_STATES.AWAITING_CONFIRMATION, 'State transitioned to AWAITING_CONFIRMATION');
assert(turn1.actionToExecute?.type === 'UPDATE_LISTING_DRAFT', 'Dispatched UPDATE_LISTING_DRAFT action');
assert(turn1.actionToExecute?.type !== 'CREATE_LISTING_SUCCESS', 'Did NOT prematurely execute CREATE_LISTING_SUCCESS');
assert(turn1.aiResponseText.includes('Is everything correct?'), 'Read-back explicitly asks for confirmation before execution');

// =============================================================================
// TEST 2: Sequential Self-Correction
// User: "Create a listing for a three-bedroom apartment in Victoria Island. It has a
// pool, a gym, and 24-hour power. The price is two hundred thousand per night.
// Sorry, one hundred and eighty thousand."
// =============================================================================
console.log('\n--- TEST 2: Sequential Self-Correction ---');
const state2 = createMockState();
const text2 = "Create a listing for a three-bedroom apartment in Victoria Island. It has a pool, a gym, and 24-hour power. The price is two hundred thousand per night. Sorry, one hundred and eighty thousand.";

const turn2 = executeVoiceCommand(text2, state2, {});

assert(turn2.listingDraft?.property_type === '3-bedroom apartment', 'Property type recognized as 3-bedroom apartment');
assert(turn2.listingDraft?.location === 'Victoria Island', 'Location recognized as Victoria Island');
assert(turn2.listingDraft?.bedrooms === 3, 'Bedrooms recognized as 3');
assert(turn2.listingDraft?.price === 180000, `Final corrected price is ₦180,000, NOT 200,000 (actual: ${turn2.listingDraft?.price})`);
assert(turn2.listingDraft?.amenities?.includes('swimming pool'), 'Amenities include swimming pool');
assert(turn2.listingDraft?.amenities?.includes('24-hour electricity'), 'Amenities include 24-hour electricity');
assert(turn2.listingDraft?.status === LISTING_STATES.AWAITING_CONFIRMATION, 'Transitioned to AWAITING_CONFIRMATION');
assert(turn2.actionToExecute?.type !== 'CREATE_LISTING_SUCCESS', 'Did NOT execute prematurely');

// =============================================================================
// TEST 3: Missing Required Information
// User: "Create a listing for a two-bedroom apartment in Lekki." (missing price)
// =============================================================================
console.log('\n--- TEST 3: Missing Required Information ---');
const state3 = createMockState();
const text3 = "Create a listing for a two-bedroom apartment in Lekki.";

const turn3 = executeVoiceCommand(text3, state3, {});

assert(turn3.listingDraft?.status === LISTING_STATES.CLARIFYING, 'Draft entered CLARIFYING state');
assert(turn3.listingDraft?.location === 'Lekki', 'Location preserved');
assert(turn3.listingDraft?.bedrooms === 2, 'Bedrooms preserved');
assert(turn3.listingDraft?.price === null, 'Price remains null without guessing');
assert(turn3.aiResponseText.toLowerCase().includes('price'), 'Kaelo asks focused question about price');
assert(turn3.actionToExecute?.type === 'UPDATE_LISTING_DRAFT', 'Preserves draft via UPDATE_LISTING_DRAFT');
assert(turn3.actionToExecute?.type !== 'CREATE_LISTING_SUCCESS', 'Did NOT create incomplete listing');

// Multi-turn continuation: user provides missing price
const turn3b = executeVoiceCommand('₦150,000 per night', state3, { activeListingDraft: turn3.listingDraft });
assert(turn3b.listingDraft?.price === 150000, 'Price updated to 150,000 on follow-up turn');
assert(turn3b.listingDraft?.status === LISTING_STATES.AWAITING_CONFIRMATION, 'Now transitions to AWAITING_CONFIRMATION');
assert(turn3b.aiResponseText.includes('Is everything correct?'), 'Presents complete read-back and asks for confirmation');

// =============================================================================
// TEST 4: Explicit Approval
// User: "Yes, create it"
// =============================================================================
console.log('\n--- TEST 4: Explicit User Approval ---');
const state4 = createMockState({ activeListingDraft: turn1.listingDraft });
const turn4 = executeVoiceCommand('Yes, create it', state4, { activeListingDraft: turn1.listingDraft });

assert(turn4.actionToExecute?.type === 'CREATE_LISTING_SUCCESS', 'Emits CREATE_LISTING_SUCCESS action on explicit approval');
assert(turn4.createdListing?.status === 'published', 'Listing status set to published');
assert(turn4.createdListing?.price === 180000, 'Created listing has correct verified price');
assert(turn4.updatedContext?.activeListingDraft === null, 'Active draft cleared after publication');
assert(turn4.aiResponseText.includes('Success!'), 'Returns affirmative confirmation message');

// Alternative confirmation triggers
const turn4b = ListingEngine.processTurn('That\'s correct', turn1.listingDraft);
assert(turn4b.actionToExecute?.type === 'CREATE_LISTING_SUCCESS', '"That\'s correct" approves creation');

const turn4c = ListingEngine.processTurn('Confirm', turn1.listingDraft);
assert(turn4c.actionToExecute?.type === 'CREATE_LISTING_SUCCESS', '"Confirm" approves creation');

// =============================================================================
// TEST 5: Rejection / Cancellation
// User: "No, that's wrong" or "Cancel"
// =============================================================================
console.log('\n--- TEST 5: Rejection & Cancellation ---');
const state5 = createMockState({ activeListingDraft: turn1.listingDraft });
const turn5 = executeVoiceCommand("No, that's wrong", state5, { activeListingDraft: turn1.listingDraft });

assert(turn5.actionToExecute?.type === 'CANCEL_LISTING_DRAFT', 'Emits CANCEL_LISTING_DRAFT on rejection');
assert(turn5.updatedContext?.activeListingDraft === null, 'Active draft cleared');
assert(turn5.createdListing === null, 'No listing was created');
assert(turn5.aiResponseText.toLowerCase().includes('cancel'), 'Explains draft was cancelled');

const turn5b = ListingEngine.processTurn('Cancel', turn1.listingDraft);
assert(turn5b.actionToExecute?.type === 'CANCEL_LISTING_DRAFT', '"Cancel" cancels draft');
assert(turn5b.status === LISTING_STATES.IDLE, 'Status reset to IDLE');

// =============================================================================
// TEST 6: Correction After Read-Back
// User: "No, make it ₦180,000 and change the location to Victoria Island"
// =============================================================================
console.log('\n--- TEST 6: In-Confirmation Correction ---');
const baseDraft6 = ListingEngine.interpret('Create a listing for a two-bedroom apartment in Lekki with price 150000');
baseDraft6.status = LISTING_STATES.AWAITING_CONFIRMATION;

const state6 = createMockState({ activeListingDraft: baseDraft6 });
const turn6 = executeVoiceCommand('No, make it ₦180,000 and change the location to Victoria Island', state6, { activeListingDraft: baseDraft6 });

assert(turn6.actionToExecute?.type === 'UPDATE_LISTING_DRAFT', 'Updates draft instead of creating listing');
assert(turn6.listingDraft?.price === 180000, `Updated price to ₦180,000 (actual: ${turn6.listingDraft?.price})`);
assert(turn6.listingDraft?.location === 'Victoria Island', `Updated location to Victoria Island (actual: ${turn6.listingDraft?.location})`);
assert(turn6.listingDraft?.bedrooms === 2, 'Preserved 2 bedrooms');
assert(turn6.listingDraft?.status === LISTING_STATES.AWAITING_CONFIRMATION, 'Remains in AWAITING_CONFIRMATION');
assert(turn6.aiResponseText.includes('Is everything correct now?'), 'Re-prompts user for confirmation after correction');

// =============================================================================
// TEST 7: Ambiguous Response
// User: "What do you think?"
// =============================================================================
console.log('\n--- TEST 7: Ambiguous Response Clarification ---');
const state7 = createMockState({ activeListingDraft: turn1.listingDraft });
const turn7 = executeVoiceCommand('What do you think?', state7, { activeListingDraft: turn1.listingDraft });

assert(turn7.actionToExecute === null, 'Does NOT execute creation or mutation on ambiguous input');
assert(turn7.listingDraft?.id === turn1.listingDraft?.id, 'Draft is preserved intact');
assert(turn7.listingDraft?.status === LISTING_STATES.AWAITING_CONFIRMATION, 'Still awaiting explicit approval');
assert(turn7.aiResponseText.includes('Would you like me to create the listing'), 'Clarifies options without guessing');

// =============================================================================
// TEST 8: Silence & Empty Turns
// Silence must NEVER imply consent
// =============================================================================
console.log('\n--- TEST 8: Silence Handling ---');
const state8 = createMockState({ activeListingDraft: turn1.listingDraft });
const turn8 = executeVoiceCommand('', state8, { activeListingDraft: turn1.listingDraft });

assert(turn8.actionToExecute === null, 'Silence does NOT trigger listing creation');
assert(turn8.listingDraft?.status === LISTING_STATES.AWAITING_CONFIRMATION, 'Draft preserved in AWAITING_CONFIRMATION');
assert(turn8.aiResponseText.includes("I'm still listening"), 'Acknowledges silence while keeping session open');

// =============================================================================
// TEST 9: Idempotency & Duplicate Event Prevention
// =============================================================================
console.log('\n--- TEST 9: Idempotency & Duplicate Submission Guard ---');
const submittedDraft = {
  ...turn1.listingDraft,
  isSubmitted: true,
  status: 'published'
};

const turn9 = ListingEngine.processTurn('Yes, create it', submittedDraft);
assert(turn9.actionToExecute === null, 'Blocked duplicate submission on already-submitted draft');
assert(turn9.aiResponseText.includes('already submitted'), 'Informs user listing was already submitted');

// =============================================================================
// TEST 10: Backend Failure Handling
// =============================================================================
console.log('\n--- TEST 10: Backend Failure Handling ---');
const state10 = createMockState({ activeListingDraft: turn1.listingDraft });
const turn10 = executeVoiceCommand('Yes, create it', state10, { 
  activeListingDraft: turn1.listingDraft,
  simulateBackendFailure: true 
});

assert(turn10.actionToExecute === null, 'No success action emitted on network failure');
assert(turn10.listingDraft?.status === LISTING_STATES.FAILURE, 'Draft status marked as FAILURE for retry');
assert(turn10.aiResponseText.toLowerCase().includes('error'), 'Informs user of error honestly');
assert(turn10.aiResponseText.toLowerCase().includes('preserved'), 'Assures user that draft is preserved');

// =============================================================================
// TEST 11: Hardware Barge-In & TTS Interruption
// =============================================================================
console.log('\n--- TEST 11: Hardware Barge-In ---');
assert(typeof voiceService.stopSpeaking === 'function', 'voiceService has stopSpeaking method');
assert(typeof voiceService.startListening === 'function', 'voiceService has startListening method');
assert(voiceService.silenceThresholdMs >= 2500, `Silence threshold is configurable and >= 2.5s (${voiceService.silenceThresholdMs}ms)`);

// =============================================================================
// TEST 12: Speech Recognition Uncertainty / Noise
// =============================================================================
console.log('\n--- TEST 12: Speech Recognition Uncertainty ---');
const state12 = createMockState({ activeListingDraft: turn1.listingDraft });
const turn12 = executeVoiceCommand('umm uhh maybe later', state12, { activeListingDraft: turn1.listingDraft });

assert(turn12.actionToExecute === null, 'Uncertain speech does not trigger listing creation');
assert(turn12.listingDraft?.price === 180000, 'Existing draft fields remain uncorrupted');
assert(turn12.listingDraft?.location === 'Lekki', 'Existing draft location remains uncorrupted');

// =============================================================================
// SUMMARY
// =============================================================================
console.log('\n================================================================');
console.log(`TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('================================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('ALL 12 ACCEPTANCE TESTS PASSED SUCCESSFULLY!\n');
}
