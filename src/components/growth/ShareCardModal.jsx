import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Share2, 
  Copy, 
  Check, 
  Flame, 
  Zap, 
  ShieldCheck, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Modal from '../ui/Modal';
import KaeloMascot from '../illustrations/KaeloMascot';
import KaeloLogo from '../ui/KaeloLogo';
import styles from './ShareCardModal.module.css';

const ShareCardModal = ({ isOpen, onClose, data = null }) => {
  const { state, dispatch } = useApp();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const user = state.user || {};
  const referralCode = state.referralCode || 'FRED84';
  const shareUrl = `https://kaelo.app/join?ref=${referralCode}`;

  const achievementTitle = data?.title || 'Execution Milestone';
  const achievementDesc = data?.description || 'Maintained a consistent daily constraint-based execution habit.';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedLink(true);
      dispatch({
        type: 'SHOW_TOAST',
        payload: {
          title: 'Referral Link Copied',
          message: 'Share with friends — both of you earn +250 XP when they execute their first mission.',
          type: 'achievement'
        }
      });
      setTimeout(() => setCopiedLink(false), 2500);
    }).catch(() => {});
  };

  const handleCopyStats = () => {
    const text = `🔥 KAELO EXECUTION CARD\n` +
      `User: ${user.name || 'Fred'} · Level ${user.level || 4} (${user.identityTitle || 'Focused Builder'})\n` +
      `Streak: ${user.streak || 8} Days | Momentum: ${user.momentum || 84}/100\n` +
      `Daily Capacity Respected: ${(state.capacity?.dailyCapacity || 3.3).toFixed(1)}h\n` +
      `Milestone: ${achievementTitle}\n` +
      `Join my squad on Kaelo: ${shareUrl}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(true);
      dispatch({
        type: 'SHOW_TOAST',
        payload: {
          title: 'Stats Copied to Clipboard',
          message: 'Ready to share on Twitter, WhatsApp, or Instagram.',
          type: 'info'
        }
      });
      setTimeout(() => setCopiedText(false), 2500);
    }).catch(() => {});
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Kaelo Execution: ${user.name}`,
        text: `I'm on an ${user.streak}-day execution streak on Kaelo. Join my squad:`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="SHARE EXECUTION CARD">
      <div className={styles.container}>
        {/* The Graphic Share Card */}
        <div className={styles.cardPreview}>
          <div className={styles.cardHeader}>
            <div className={styles.brandRow}>
              <KaeloLogo size={20} showAI={true} />
              <span className={styles.verifiedDot} />
            </div>
            <span className={styles.cardWatermark}>PROOF OF WORK</span>
          </div>

          <div className={styles.cardBody}>
            <div className={styles.mascotWrapper}>
              <KaeloMascot variant="celebrate" size={68} />
            </div>

            <div className={styles.userTitleRow}>
              <h3 className={styles.userName}>{user.name || 'Fred'}</h3>
              <span className={styles.identityTag}>{user.identityTitle || 'Focused Builder'}</span>
            </div>

            <div className={styles.achievementHighlight}>
              <div className={styles.achievementBadge}>
                <Sparkles size={13} /> {achievementTitle.toUpperCase()}
              </div>
              <p className={styles.achievementQuote}>"{achievementDesc}"</p>
            </div>

            <div className={styles.statsRow}>
              <div className={styles.statPill}>
                <Flame size={14} className={styles.statFlame} />
                <div className={styles.statInfo}>
                  <span className={styles.statNum}>{user.streak || 8}d</span>
                  <span className={styles.statLabel}>STREAK</span>
                </div>
              </div>

              <div className={styles.statPill}>
                <Zap size={14} className={styles.statZap} />
                <div className={styles.statInfo}>
                  <span className={styles.statNum}>{user.momentum || 84}</span>
                  <span className={styles.statLabel}>MOMENTUM</span>
                </div>
              </div>

              <div className={styles.statPill}>
                <ShieldCheck size={14} className={styles.statShield} />
                <div className={styles.statInfo}>
                  <span className={styles.statNum}>Lvl {user.level || 4}</span>
                  <span className={styles.statLabel}>IDENTITY</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.cardFooter}>
            <span className={styles.referralLinkPreview}>kaelo.app/join?ref={referralCode}</span>
            <span className={styles.cardPerkNote}>+250 XP BONUS FOR BOTH</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <button className={styles.primaryShareBtn} onClick={handleNativeShare}>
            <Share2 size={16} /> SHARE TO FRIENDS
          </button>
          <div className={styles.secondaryRow}>
            <button className={styles.secondaryBtn} onClick={handleCopyLink}>
              {copiedLink ? <Check size={14} /> : <Copy size={14} />}
              {copiedLink ? 'LINK COPIED' : 'COPY REFERRAL LINK'}
            </button>
            <button className={styles.secondaryBtn} onClick={handleCopyStats}>
              {copiedText ? <Check size={14} /> : <Copy size={14} />}
              {copiedText ? 'COPIED' : 'COPY TEXT STATS'}
            </button>
          </div>
        </div>

        <div className={styles.referralMeta}>
          You have referred <strong>{state.referralsCount || 3} friends</strong> and earned <strong>{state.referralXPEarned || 750} XP</strong>.
        </div>
      </div>
    </Modal>
  );
};

export default ShareCardModal;
