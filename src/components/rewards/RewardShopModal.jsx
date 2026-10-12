import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  ShieldCheck, 
  Flame, 
  Zap, 
  Calendar, 
  History, 
  Check, 
  ArrowRight,
  Clock,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { REWARD_ITEMS } from '../../data/rewardsCatalogue';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import styles from './RewardShopModal.module.css';

const ICON_MAP = {
  Sparkles,
  ShieldCheck,
  Zap,
  Flame,
  Calendar,
};

const RewardShopModal = ({ isOpen, onClose }) => {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState('catalogue'); // 'catalogue' | 'ledger'
  const userXP = state.user?.xp || 0;
  const activePerks = state.activePerks || {};
  const ledger = state.xpLedger || [];

  const handleRedeem = (item) => {
    dispatch({
      type: 'REDEEM_REWARD',
      payload: item
    });
  };

  const isPerkActive = (item) => {
    if (item.id === 'pro_pass_1d') {
      return Boolean(activePerks.proUntil && new Date(activePerks.proUntil).getTime() > Date.now());
    }
    if (item.id === 'focus_multiplier_24h') {
      return Boolean(activePerks.xpMultiplierUntil && new Date(activePerks.xpMultiplierUntil).getTime() > Date.now());
    }
    if (item.id === 'weekend_capacity_unlock') {
      return Boolean(activePerks.hasWeekendProfile);
    }
    return false;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="XP PERKS & REWARDS">
      <div className={styles.container}>
        {/* XP Balance Hero Card */}
        <div className={styles.balanceCard}>
          <div className={styles.balanceInfo}>
            <span className={styles.balanceLabel}>AVAILABLE XP BALANCE</span>
            <div className={styles.balanceValRow}>
              <span className={styles.balanceNumber}>{userXP.toLocaleString()}</span>
              <span className={styles.balanceUnit}>XP</span>
            </div>
          </div>
          <div className={styles.activePerksSummary}>
            {activePerks.streakShields > 0 && (
              <span className={styles.perkPill}>
                <ShieldCheck size={12} /> {activePerks.streakShields} Shield{activePerks.streakShields > 1 ? 's' : ''}
              </span>
            )}
            {activePerks.xpMultiplierUntil && new Date(activePerks.xpMultiplierUntil).getTime() > Date.now() && (
              <span className={`${styles.perkPill} ${styles.perkPillActive}`}>
                <Flame size={12} /> 2x Boost Active
              </span>
            )}
            {activePerks.proUntil && new Date(activePerks.proUntil).getTime() > Date.now() && (
              <span className={`${styles.perkPill} ${styles.perkPillPro}`}>
                <Sparkles size={12} /> Pro Pass Active
              </span>
            )}
          </div>
        </div>

        {/* Tab Toggle */}
        <div className={styles.tabBar}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'catalogue' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('catalogue')}
          >
            <Layers size={14} /> Digital Perks
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'ledger' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('ledger')}
          >
            <History size={14} /> XP Ledger ({ledger.length})
          </button>
        </div>

        {/* Tab Content: Rewards Catalogue */}
        {activeTab === 'catalogue' && (
          <div className={styles.catalogueList}>
            {REWARD_ITEMS.map((item) => {
              const IconComponent = ICON_MAP[item.icon] || Sparkles;
              const canAfford = userXP >= item.cost;
              const isActive = isPerkActive(item);

              return (
                <div key={item.id} className={styles.rewardCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.iconWrapper}>
                      <IconComponent size={20} className={styles.icon} />
                    </div>
                    <div className={styles.titleInfo}>
                      <div className={styles.titleRow}>
                        <h4 className={styles.itemTitle}>{item.title}</h4>
                        <span className={styles.itemBadge}>{item.badge}</span>
                      </div>
                      <p className={styles.itemDesc}>{item.description}</p>
                    </div>
                  </div>

                  <div className={styles.cardFooter}>
                    <div className={styles.costTag}>
                      <span className={styles.costVal}>{item.cost}</span>
                      <span className={styles.costUnit}>XP</span>
                    </div>

                    {isActive ? (
                      <span className={styles.activeTag}>
                        <Check size={13} /> ACTIVE NOW
                      </span>
                    ) : (
                      <button
                        className={`${styles.redeemBtn} ${canAfford ? styles.redeemBtnReady : styles.redeemBtnDisabled}`}
                        disabled={!canAfford}
                        onClick={() => handleRedeem(item)}
                      >
                        {canAfford ? 'REDEEM PERK' : `NEED ${item.cost - userXP} MORE XP`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab Content: XP Ledger Audit Trail */}
        {activeTab === 'ledger' && (
          <div className={styles.ledgerList}>
            <div className={styles.ledgerHeader}>
              <span>EVENT & REASON</span>
              <span>XP AMOUNT</span>
            </div>
            {ledger.map((entry) => {
              const isEarned = entry.type === 'EARNED';
              return (
                <div key={entry.id} className={styles.ledgerItem}>
                  <div className={styles.ledgerLeft}>
                    <div className={styles.ledgerReason}>{entry.reason}</div>
                    <div className={styles.ledgerTime}>
                      {new Date(entry.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className={`${styles.ledgerAmount} ${isEarned ? styles.amountEarned : styles.amountRedeemed}`}>
                    {isEarned ? `+${entry.amount}` : `-${entry.amount}`} XP
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className={styles.footerNote}>
          XP is earned by executing scheduled priorities, finishing deep focus blocks, and protecting capacity.
        </div>
      </div>
    </Modal>
  );
};

export default RewardShopModal;
