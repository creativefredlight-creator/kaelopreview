// ==========================================
// KAELO ANALYTICS ENGINE
// Tracks genuine product events, activations, and user journeys
// ==========================================

import { storage } from './helpers.js';

const ANALYTICS_STORAGE_KEY = 'analytics_events';
const MAX_STORED_EVENTS = 200;

export const AnalyticsEvents = {
  // Activation & Onboarding
  ONBOARDING_COMPLETED: 'onboarding_completed',
  FIRST_USEFUL_AI_INTERACTION: 'first_useful_ai_interaction',
  FIRST_TASK_STARTED: 'first_task_started',
  FIRST_TASK_COMPLETED: 'first_task_completed',

  // Daily Execution & Lock In
  LOCK_IN_STARTED: 'lock_in_started',
  LOCK_IN_COMPLETED: 'lock_in_completed',
  LOCK_IN_PAUSED: 'lock_in_paused',
  DAY_REBALANCED: 'day_rebalanced',
  END_OF_DAY_RECAP_VIEWED: 'end_of_day_recap_viewed',

  // Quests & Progression
  QUEST_CREATED: 'quest_created',
  QUEST_COMPLETED: 'quest_completed',
  MILESTONE_COMPLETED: 'milestone_completed',
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
  LEVEL_UP: 'level_up',

  // XP Economy & Monetization
  XP_EARNED: 'xp_earned',
  XP_REDEEMED: 'xp_redeemed',
  SUBSCRIPTION_MODAL_VIEWED: 'subscription_modal_viewed',
  SUBSCRIPTION_UPGRADED: 'subscription_upgraded',
  PRO_PASS_ACTIVATED: 'pro_pass_activated',

  // Retention & Recovery
  RETURN_AFTER_INACTIVITY: 'return_after_inactivity',
  RECOVERY_PLAN_APPLIED: 'recovery_plan_applied',
  STREAK_SHIELD_USED: 'streak_shield_used',

  // Organic Growth & Social
  ACHIEVEMENT_SHARED: 'achievement_shared',
  REFERRAL_LINK_COPIED: 'referral_link_copied',
  REFERRAL_CONVERTED: 'referral_converted',
  SQUAD_CREATED: 'squad_created',
  SQUAD_JOINED: 'squad_joined',
};

class AnalyticsService {
  constructor() {
    this.events = storage.get(ANALYTICS_STORAGE_KEY) || [];
  }

  /**
   * Track an event with properties and persistence
   */
  track(eventName, properties = {}) {
    const event = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: eventName,
      timestamp: new Date().toISOString(),
      properties: {
        ...properties,
        url: typeof window !== 'undefined' ? window.location.pathname : '',
      }
    };

    this.events.unshift(event);
    if (this.events.length > MAX_STORED_EVENTS) {
      this.events = this.events.slice(0, MAX_STORED_EVENTS);
    }

    storage.set(ANALYTICS_STORAGE_KEY, this.events);

    // Optional console log during development for transparency
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
      console.log(`[Analytics] ${eventName}:`, properties);
    }

    return event;
  }

  getEvents() {
    return this.events;
  }

  getEventsByName(eventName) {
    return this.events.filter(e => e.name === eventName);
  }

  clearEvents() {
    this.events = [];
    storage.remove(ANALYTICS_STORAGE_KEY);
  }
}

export const analytics = new AnalyticsService();
export default analytics;
