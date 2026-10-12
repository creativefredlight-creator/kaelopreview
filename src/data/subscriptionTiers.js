// ==========================================
// KAELO SUBSCRIPTION TIERS & ENTITLEMENTS
// Freemium model with Free, Plus, and Pro
// ==========================================

export const SUBSCRIPTION_TIERS = {
  free: {
    id: 'free',
    name: 'Starter',
    tagline: 'Realistic execution fundamentals',
    priceMonthly: 0,
    priceAnnual: 0,
    badge: 'FREE',
    color: '#8E8E93',
    features: [
      'Realistic 24h capacity calculation engine',
      'Daily mission planner with momentum tracking',
      '3D execution road & gamified milestone progression',
      'Standard AI coach (text + web voice)',
      '1 active ambitious Quest with milestones',
      'Up to 4 auto-learned memory context items',
    ],
    limits: {
      activeQuests: 1,
      memorySlots: 4,
      aiVoiceMinutesPerDay: 15,
      squadAccess: 'member_only',
    }
  },
  plus: {
    id: 'plus',
    name: 'Kaelo Plus',
    tagline: 'For ambitious students & builders',
    priceMonthly: 9.99,
    priceAnnual: 7.99, // $95.88/yr
    badge: 'PLUS',
    color: 'var(--kaelo-lime)',
    features: [
      'Everything in Starter',
      'Unlimited active Quests & milestones',
      'Continuous hands-free AI voice coaching',
      'Instant AI "Fix My Day" rebalancing',
      'Up to 15 persistent memory context slots',
      'Private Accountability Squad creation',
      'Automatic streak protection (1 shield/month)',
    ],
    limits: {
      activeQuests: 999,
      memorySlots: 15,
      aiVoiceMinutesPerDay: 120,
      squadAccess: 'create_and_join',
    }
  },
  pro: {
    id: 'pro',
    name: 'Kaelo Pro',
    tagline: 'Peak executive function & deep planning',
    priceMonthly: 19.99,
    priceAnnual: 15.99, // $191.88/yr
    badge: 'PRO',
    color: '#A982FF',
    features: [
      'Everything in Plus',
      'Deep workload & fatigue feasibility forecasting',
      'Custom weekend vs. weekday capacity models',
      'Unlimited persistent memory & habit profiling',
      'Priority Claude Opus async planning & weekly replans',
      'Squad Leader privileges & group challenges',
      'Unlimited XP pass redemptions for team & friends',
    ],
    limits: {
      activeQuests: 999,
      memorySlots: 999,
      aiVoiceMinutesPerDay: 9999,
      squadAccess: 'squad_leader',
    }
  }
};

/**
 * Check if the user is authorized to use a given feature.
 * Automatically accounts for active temporary Pro passes!
 */
export function canAccessFeature(featureKey, userState = {}) {
  const userTier = userState.tier || 'free';
  const activePerks = userState.activePerks || {};

  // Check for active Pro pass
  const isTempPro = activePerks.proUntil && new Date(activePerks.proUntil).getTime() > Date.now();
  const effectiveTier = isTempPro ? 'pro' : userTier;

  if (effectiveTier === 'pro') return true;

  switch (featureKey) {
    case 'unlimited_quests':
      return effectiveTier === 'plus' || effectiveTier === 'pro';
    case 'auto_rebalance':
      return effectiveTier === 'plus' || effectiveTier === 'pro' || Boolean(activePerks.rebalanceTokens > 0);
    case 'deep_forecasting':
      return effectiveTier === 'pro';
    case 'custom_weekend_capacity':
      return effectiveTier === 'pro' || Boolean(activePerks.hasWeekendProfile);
    case 'create_squad':
      return effectiveTier === 'plus' || effectiveTier === 'pro';
    case 'expanded_memory':
      return effectiveTier === 'plus' || effectiveTier === 'pro';
    default:
      return true;
  }
}
