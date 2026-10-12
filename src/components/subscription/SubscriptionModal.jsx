import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Check, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Crown, 
  ArrowRight,
  Clock,
  Layers,
  HelpCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SUBSCRIPTION_TIERS } from '../../data/subscriptionTiers';
import Modal from '../ui/Modal';
import styles from './SubscriptionModal.module.css';

const SubscriptionModal = ({ isOpen, onClose }) => {
  const { state, dispatch } = useApp();
  const [billingCycle, setBillingCycle] = useState('annual'); // 'monthly' | 'annual'
  const currentTier = state.user?.tier || 'free';
  const activePerks = state.activePerks || {};
  const isTempPro = Boolean(activePerks.proUntil && new Date(activePerks.proUntil).getTime() > Date.now());

  const handleSelectTier = (tierKey) => {
    dispatch({
      type: 'UPGRADE_TIER',
      payload: { tier: tierKey, billing: billingCycle }
    });
    onClose();
  };

  const handleRedeemProPass = () => {
    dispatch({
      type: 'REDEEM_REWARD',
      payload: {
        id: 'pro_pass_1d',
        title: '1-Day Pro Pass',
        cost: 600,
      }
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="MEMBERSHIP & TIERS">
      <div className={styles.container}>
        {/* Header Hero */}
        <div className={styles.hero}>
          <div className={styles.heroBadge}>
            <Crown size={13} /> EXPAND YOUR EXECUTION ENGINE
          </div>
          <h3 className={styles.heroTitle}>Unlock Deeper Planning & Pro Coach</h3>
          <p className={styles.heroSubtitle}>
            Constraint-based execution for ambitious students, builders, and professionals.
          </p>

          {/* Billing Toggle */}
          <div className={styles.toggleRow}>
            <button
              className={`${styles.cycleBtn} ${billingCycle === 'monthly' ? styles.cycleBtnActive : ''}`}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </button>
            <button
              className={`${styles.cycleBtn} ${billingCycle === 'annual' ? styles.cycleBtnActive : ''}`}
              onClick={() => setBillingCycle('annual')}
            >
              Annual <span className={styles.saveTag}>SAVE 20%</span>
            </button>
          </div>
        </div>

        {/* Tier Cards List */}
        <div className={styles.tiersGrid}>
          {/* Starter (Free) */}
          <div className={`${styles.tierCard} ${currentTier === 'free' && !isTempPro ? styles.tierCardCurrent : ''}`}>
            <div className={styles.tierTop}>
              <div className={styles.tierNameRow}>
                <h4 className={styles.tierName}>{SUBSCRIPTION_TIERS.free.name}</h4>
                <span className={styles.tierBadgeFree}>CURRENT</span>
              </div>
              <p className={styles.tierTagline}>{SUBSCRIPTION_TIERS.free.tagline}</p>
              <div className={styles.priceRow}>
                <span className={styles.priceVal}>$0</span>
                <span className={styles.pricePeriod}>/ forever</span>
              </div>
            </div>

            <ul className={styles.featureList}>
              {SUBSCRIPTION_TIERS.free.features.map((feat, i) => (
                <li key={i} className={styles.featureItem}>
                  <Check size={14} className={styles.checkIcon} />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Kaelo Plus */}
          <div className={`${styles.tierCard} ${styles.tierCardPlus} ${currentTier === 'plus' ? styles.tierCardCurrent : ''}`}>
            <div className={styles.tierTop}>
              <div className={styles.tierNameRow}>
                <h4 className={styles.tierName}>{SUBSCRIPTION_TIERS.plus.name}</h4>
                <span className={styles.tierBadgePlus}>POPULAR</span>
              </div>
              <p className={styles.tierTagline}>{SUBSCRIPTION_TIERS.plus.tagline}</p>
              <div className={styles.priceRow}>
                <span className={styles.priceVal}>
                  ${billingCycle === 'annual' ? SUBSCRIPTION_TIERS.plus.priceAnnual : SUBSCRIPTION_TIERS.plus.priceMonthly}
                </span>
                <span className={styles.pricePeriod}>/ month</span>
              </div>
            </div>

            <ul className={styles.featureList}>
              {SUBSCRIPTION_TIERS.plus.features.map((feat, i) => (
                <li key={i} className={styles.featureItem}>
                  <Check size={14} className={styles.checkIconPlus} />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>

            {currentTier === 'plus' ? (
              <div className={styles.activePlanTag}>CURRENT ACTIVE PLAN</div>
            ) : (
              <button
                className={styles.upgradeBtnPlus}
                onClick={() => handleSelectTier('plus')}
              >
                SELECT PLUS PLAN
              </button>
            )}
          </div>

          {/* Kaelo Pro */}
          <div className={`${styles.tierCard} ${styles.tierCardPro} ${currentTier === 'pro' || isTempPro ? styles.tierCardCurrent : ''}`}>
            <div className={styles.tierTop}>
              <div className={styles.tierNameRow}>
                <h4 className={styles.tierName}>{SUBSCRIPTION_TIERS.pro.name}</h4>
                <span className={styles.tierBadgePro}>ELITE SYSTEM</span>
              </div>
              <p className={styles.tierTagline}>{SUBSCRIPTION_TIERS.pro.tagline}</p>
              <div className={styles.priceRow}>
                <span className={styles.priceVal}>
                  ${billingCycle === 'annual' ? SUBSCRIPTION_TIERS.pro.priceAnnual : SUBSCRIPTION_TIERS.pro.priceMonthly}
                </span>
                <span className={styles.pricePeriod}>/ month</span>
              </div>
            </div>

            <ul className={styles.featureList}>
              {SUBSCRIPTION_TIERS.pro.features.map((feat, i) => (
                <li key={i} className={styles.featureItem}>
                  <Sparkles size={14} className={styles.checkIconPro} />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>

            {currentTier === 'pro' || isTempPro ? (
              <div className={styles.activePlanTag}>
                {isTempPro ? 'PRO PASS ACTIVE' : 'CURRENT ACTIVE PLAN'}
              </div>
            ) : (
              <button
                className={styles.upgradeBtnPro}
                onClick={() => handleSelectTier('pro')}
              >
                UPGRADE TO PRO
              </button>
            )}
          </div>
        </div>

        {/* Alternative: Redeem 1-Day Pro with XP */}
        {currentTier !== 'pro' && !isTempPro && (
          <div className={styles.xpAlternativeCard}>
            <div className={styles.xpAltLeft}>
              <div className={styles.xpAltIcon}>
                <Sparkles size={18} />
              </div>
              <div>
                <div className={styles.xpAltTitle}>Test Drive Pro with XP</div>
                <div className={styles.xpAltDesc}>Redeem a 24-hour full Pro pass using 600 of your earned execution XP.</div>
              </div>
            </div>
            <button 
              className={styles.xpAltBtn}
              onClick={handleRedeemProPass}
              disabled={(state.user?.xp || 0) < 600}
            >
              {(state.user?.xp || 0) >= 600 ? 'USE 600 XP' : 'NEED 600 XP'}
            </button>
          </div>
        )}

        <div className={styles.disclaimerText}>
          Payment Gateway: Stripe sandbox mode initialized. Upgrades immediately apply real feature entitlements in-app without charging a live credit card.
        </div>
      </div>
    </Modal>
  );
};

export default SubscriptionModal;
