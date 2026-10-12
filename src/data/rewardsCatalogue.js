// ==========================================
// KAELO XP REWARDS CATALOGUE
// Tangible digital utility for earned XP
// ==========================================

export const REWARD_ITEMS = [
  {
    id: 'pro_pass_1d',
    title: '1-Day Pro Pass',
    category: 'entitlement',
    cost: 600,
    icon: 'Sparkles',
    badge: 'PRO ACCESS',
    description: 'Unlock 24 hours of Kaelo Pro: unlimited AI voice coaching, automated day rebalancer, and deep workload forecasting.',
    durationHours: 24,
    perkKey: 'pro_tier',
  },
  {
    id: 'streak_shield',
    title: 'Streak Shield',
    category: 'protection',
    cost: 400,
    icon: 'ShieldCheck',
    badge: 'PROTECTION',
    description: 'Protects your execution streak from resetting if an unavoidable life emergency prevents completing tasks today.',
    maxStack: 3,
    perkKey: 'streak_shield',
  },
  {
    id: 'ai_rebalance_token',
    title: 'Deep AI Rebalancer',
    category: 'coaching',
    cost: 300,
    icon: 'Zap',
    badge: 'OPTIMIZATION',
    description: 'Instant algorithmic redistribution of overloaded days into realistic, fatigue-calibrated execution blocks.',
    perkKey: 'rebalance_token',
  },
  {
    id: 'focus_multiplier_24h',
    title: 'Focus XP Multiplier (2x)',
    category: 'boost',
    cost: 500,
    icon: 'Flame',
    badge: '2X XP BOOST',
    description: 'Earn double XP for all Lock In focus sessions completed over the next 24 hours.',
    durationHours: 24,
    perkKey: 'xp_multiplier',
  },
  {
    id: 'weekend_capacity_unlock',
    title: 'Custom Weekend Profile',
    category: 'customization',
    cost: 800,
    icon: 'Calendar',
    badge: 'SYSTEM PERK',
    description: 'Enables independent capacity limits for Saturdays and Sundays so your weekend planning matches real rest and life.',
    perkKey: 'weekend_profile',
  }
];

export function getRewardItem(id) {
  return REWARD_ITEMS.find(r => r.id === id) || null;
}
