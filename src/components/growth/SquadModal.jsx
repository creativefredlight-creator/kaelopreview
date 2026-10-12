import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Target, 
  Flame, 
  Check, 
  Copy, 
  UserPlus, 
  Clock, 
  Zap, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Modal from '../ui/Modal';
import ProgressBar from '../ui/ProgressBar';
import styles from './SquadModal.module.css';

const SquadModal = ({ isOpen, onClose }) => {
  const { state, dispatch } = useApp();
  const [copied, setCopied] = useState(false);

  const squad = state.squad || {
    name: 'Morning Focus Squad',
    motto: 'Execution before 11 AM.',
    targetWeeklyFocusMinutes: 600,
    currentWeeklyFocusMinutes: 485,
    members: [
      { id: 'm1', name: state.user?.name || 'Fred', level: state.user?.level || 4, avatarInitial: (state.user?.name || 'F')[0], todayCompleted: 2, todayTotal: 3, isYou: true },
      { id: 'm2', name: 'Amina K.', level: 5, avatarInitial: 'A', todayCompleted: 3, todayTotal: 3, isYou: false },
      { id: 'm3', name: 'Marcus T.', level: 3, avatarInitial: 'M', todayCompleted: 1, todayTotal: 2, isYou: false }
    ]
  };

  const referralCode = state.referralCode || 'FRED84';
  const squadInviteUrl = `https://kaelo.app/squad?code=${squad.id || 'focus_squad'}&ref=${referralCode}`;

  const progressPercent = Math.min(100, Math.round((squad.currentWeeklyFocusMinutes / squad.targetWeeklyFocusMinutes) * 100));

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(squadInviteUrl).then(() => {
      setCopied(true);
      dispatch({
        type: 'SHOW_TOAST',
        payload: {
          title: 'Squad Invite Link Copied',
          message: 'Share with friends to build together without clutter.',
          type: 'info'
        }
      });
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  };

  const handleStartSquadFocus = () => {
    const pending = state.tasks?.find(t => t.status !== 'completed');
    if (pending) {
      dispatch({ type: 'SET_ACTIVE_FOCUS', payload: pending });
      onClose();
      dispatch({
        type: 'SHOW_TOAST',
        payload: {
          title: 'Squad Focus Started',
          message: `Locked in for ${squad.name}. Your minutes count toward the weekly target!`,
          type: 'xp'
        }
      });
    } else {
      dispatch({
        type: 'SHOW_TOAST',
        payload: {
          title: 'Missions Complete',
          message: 'All your planned missions for today are executed!',
          type: 'achievement'
        }
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="ACCOUNTABILITY SQUAD">
      <div className={styles.container}>
        {/* Squad Header Card */}
        <div className={styles.squadHeroCard}>
          <div className={styles.squadTop}>
            <div className={styles.squadBadge}>
              <Users size={13} /> PRIVATE SQUAD
            </div>
            <h3 className={styles.squadName}>{squad.name}</h3>
            <p className={styles.squadMotto}>"{squad.motto}"</p>
          </div>

          {/* Weekly Group Target */}
          <div className={styles.weeklyTargetBox}>
            <div className={styles.targetLabelRow}>
              <span className={styles.targetLabel}>WEEKLY SQUAD FOCUS TARGET</span>
              <span className={styles.targetNum}>
                {squad.currentWeeklyFocusMinutes} / {squad.targetWeeklyFocusMinutes}m ({progressPercent}%)
              </span>
            </div>
            <ProgressBar value={progressPercent} color="lime" height="md" animated />
          </div>
        </div>

        {/* Member List */}
        <div className={styles.sectionHeader}>
          <span>SQUAD MEMBERS ({squad.members.length})</span>
          <span>TODAY'S EXECUTION</span>
        </div>

        <div className={styles.memberList}>
          {squad.members.map((member) => {
            const isAllDone = member.todayCompleted >= member.todayTotal;
            return (
              <div key={member.id} className={`${styles.memberRow} ${member.isYou ? styles.memberRowYou : ''}`}>
                <div className={styles.memberLeft}>
                  <div className={styles.avatarCircle}>
                    {member.avatarInitial}
                  </div>
                  <div className={styles.memberMeta}>
                    <div className={styles.memberName}>
                      {member.name} {member.isYou && <span className={styles.youBadge}>YOU</span>}
                    </div>
                    <div className={styles.memberLevel}>Level {member.level} Executor</div>
                  </div>
                </div>

                <div className={styles.memberRight}>
                  <span className={`${styles.statusPill} ${isAllDone ? styles.statusDone : ''}`}>
                    {isAllDone && <Check size={11} />}
                    {member.todayCompleted}/{member.todayTotal} Missions
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className={styles.actionRow}>
          <button className={styles.startFocusBtn} onClick={handleStartSquadFocus}>
            <Flame size={15} /> START SQUAD LOCK IN
          </button>
          <button className={styles.inviteBtn} onClick={handleCopyInvite}>
            {copied ? <Check size={14} /> : <UserPlus size={14} />}
            {copied ? 'COPIED' : 'INVITE FRIEND'}
          </button>
        </div>

        <div className={styles.squadNotice}>
          Accountability squads share daily execution rates and focus minutes without distraction feeds or noise.
        </div>
      </div>
    </Modal>
  );
};

export default SquadModal;
