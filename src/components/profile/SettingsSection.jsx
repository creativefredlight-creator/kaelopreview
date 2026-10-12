import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  ChevronRight, 
  Bell, 
  Moon, 
  Briefcase, 
  Zap, 
  User, 
  Database, 
  Sparkles, 
  Mail, 
  CheckCircle,
  Volume2,
  Mic,
  Trash2,
  Brain,
  Plus,
  Crown,
  Gift,
  Users,
  Share2,
  ShieldCheck
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import ThemeSwitcher from '../ui/ThemeSwitcher';
import AuthModal from '../auth/AuthModal';
import styles from './SettingsSection.module.css';

const SettingsSection = () => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState({
    reminders: true,
    streak: true,
    completion: true
  });

  const [editingSchedule, setEditingSchedule] = useState(false);
  const [editingIdentity, setEditingIdentity] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);

  const [newMemoryTitle, setNewMemoryTitle] = useState('');
  const [newMemoryDetail, setNewMemoryDetail] = useState('');
  const [newMemoryCategory, setNewMemoryCategory] = useState('habits');

  const [sleepHours, setSleepHours] = useState(state.capacity?.sleepHours || 7);
  const [workHours, setWorkHours] = useState(state.capacity?.workHours || 8);
  const [fixedHours, setFixedHours] = useState(state.capacity?.fixedCommitments || 2);

  const [userName, setUserName] = useState(state.user?.name || '');
  const [userIdentity, setUserIdentity] = useState(state.user?.identity || '');

  const toggleNotif = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddMemory = (e) => {
    e.preventDefault();
    if (!newMemoryTitle.trim() || !newMemoryDetail.trim()) return;
    dispatch({
      type: 'ADD_MEMORY_ITEM',
      payload: {
        title: newMemoryTitle.trim(),
        detail: newMemoryDetail.trim(),
        category: newMemoryCategory
      }
    });
    setNewMemoryTitle('');
    setNewMemoryDetail('');
  };

  const handleSaveSchedule = (e) => {
    e.preventDefault();
    dispatch({
      type: 'SET_CAPACITY',
      payload: {
        sleepHours: Number(sleepHours),
        workHours: Number(workHours),
        fixedCommitments: Number(fixedHours),
      }
    });
    dispatch({
      type: 'SHOW_TOAST',
      payload: {
        title: 'Schedule Updated',
        message: 'Your daily capacity has been recalculated.',
        type: 'info'
      }
    });
    setEditingSchedule(false);
  };

  const handleSaveIdentity = (e) => {
    e.preventDefault();
    dispatch({
      type: 'UPDATE_USER',
      payload: {
        name: userName.trim() || state.user?.name,
        identity: userIdentity.trim() || state.user?.identity,
      }
    });
    dispatch({
      type: 'SHOW_TOAST',
      payload: {
        title: 'Profile Updated',
        message: 'Your identity statement has been updated.',
        type: 'info'
      }
    });
    setEditingIdentity(false);
  };

  const handleResetData = () => {
    if (window.confirm("Are you sure you want to reset all data and restart onboarding? This cannot be undone.")) {
      dispatch({ type: 'RESET_STATE' });
      navigate('/');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.group}>
        <h3 className={styles.groupTitle}>Schedule & Capacity</h3>
        <div className={styles.card}>
          <div className={styles.item} onClick={() => setEditingSchedule(true)}>
            <div className={styles.itemLeft}>
              <Moon size={18} className={styles.icon} />
              <span>Sleep Hours</span>
            </div>
            <div className={styles.itemRight}>
              <span className={styles.value}>{state.capacity?.sleepHours || 7}h</span>
              <ChevronRight size={16} className={styles.chevron} />
            </div>
          </div>
          <div className={styles.divider} />
          <div className={styles.item} onClick={() => setEditingSchedule(true)}>
            <div className={styles.itemLeft}>
              <Briefcase size={18} className={styles.icon} />
              <span>Work & Fixed Time</span>
            </div>
            <div className={styles.itemRight}>
              <span className={styles.value}>{(state.capacity?.workHours || 8) + (state.capacity?.fixedCommitments || 2)}h</span>
              <ChevronRight size={16} className={styles.chevron} />
            </div>
          </div>
          <div className={styles.divider} />
          <div className={styles.item}>
            <div className={styles.itemLeft}>
              <Zap size={18} className={styles.icon} />
              <span>Daily Realistic Capacity</span>
            </div>
            <div className={styles.itemRight}>
              <span className={styles.valueHighlight}>{state.capacity?.dailyCapacity || 4.5}h / day</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.group}>
        <h3 className={styles.groupTitle}>AI Coach & Memory</h3>
        <div className={styles.card}>
          <div className={styles.item} onClick={() => setIsMemoryModalOpen(true)}>
            <div className={styles.itemLeft}>
              <Brain size={18} className={styles.icon} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Learned Coach Memory
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {state.memory?.length || 0} active insights about your habits & style
                </div>
              </div>
            </div>
            <div className={styles.itemRight}>
              <span className={styles.valueHighlight}>Manage</span>
              <ChevronRight size={16} className={styles.chevron} />
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.item}>
            <div className={styles.itemLeft}>
              <Zap size={18} className={styles.icon} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Ambient Mascot Orb
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Floating companion widget on screen
                </div>
              </div>
            </div>
            <div className={styles.itemRight}>
              <div 
                className={`${styles.toggle} ${state.orbVisible !== false ? styles.toggleOn : ''}`}
                onClick={() => dispatch({ type: 'TOGGLE_ORB_VISIBLE' })}
              >
                <div className={styles.toggleKnob} />
              </div>
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.item}>
            <div className={styles.itemLeft}>
              <Volume2 size={18} className={styles.icon} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Coach Voice Autoplay
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Speak coach responses aloud automatically
                </div>
              </div>
            </div>
            <div className={styles.itemRight}>
              <div 
                className={`${styles.toggle} ${state.voiceSettings?.autoplay !== false ? styles.toggleOn : ''}`}
                onClick={() => dispatch({ 
                  type: 'UPDATE_VOICE_SETTINGS', 
                  payload: { autoplay: !(state.voiceSettings?.autoplay !== false) } 
                })}
              >
                <div className={styles.toggleKnob} />
              </div>
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.item} onClick={() => dispatch({ type: 'OPEN_VOICE_COACH' })}>
            <div className={styles.itemLeft}>
              <Mic size={18} className={styles.icon} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Launch Voice Coach
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Hands-free conversational coach mode
                </div>
              </div>
            </div>
            <div className={styles.itemRight}>
              <ChevronRight size={16} className={styles.chevron} />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.group}>
        <h3 className={styles.groupTitle}>Notifications (Max 3/day)</h3>
        <div className={styles.card}>
          <div className={styles.item}>
            <div className={styles.itemLeft}>
              <Bell size={18} className={styles.icon} />
              <span>Task Reminders</span>
            </div>
            <div className={styles.itemRight}>
              <div 
                className={`${styles.toggle} ${notifications.reminders ? styles.toggleOn : ''}`}
                onClick={() => toggleNotif('reminders')}
              >
                <div className={styles.toggleKnob} />
              </div>
            </div>
          </div>
          <div className={styles.divider} />
          <div className={styles.item}>
            <div className={styles.itemLeft}>
              <Zap size={18} className={styles.icon} />
              <span>Streak Warnings</span>
            </div>
            <div className={styles.itemRight}>
              <div 
                className={`${styles.toggle} ${notifications.streak ? styles.toggleOn : ''}`}
                onClick={() => toggleNotif('streak')}
              >
                <div className={styles.toggleKnob} />
              </div>
            </div>
          </div>
          <div className={styles.divider} />
          <div className={styles.item}>
            <div className={styles.itemLeft}>
              <Sparkles size={18} className={styles.icon} />
              <span>Capacity Alerts</span>
            </div>
            <div className={styles.itemRight}>
              <div 
                className={`${styles.toggle} ${notifications.completion ? styles.toggleOn : ''}`}
                onClick={() => toggleNotif('completion')}
              >
                <div className={styles.toggleKnob} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.group}>
        <h3 className={styles.groupTitle}>App Theme & Appearance</h3>
        <div className={styles.card} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Active Mood</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-purple)' }}>
              {state.theme === 'night' ? 'Night Mood' : state.theme === 'dark' ? 'Dark Mood' : 'Light Mood'}
            </span>
          </div>
          <ThemeSwitcher compact={false} />
        </div>
      </div>

      <div className={styles.group}>
        <h3 className={styles.groupTitle}>Membership, Perks & Growth</h3>
        <div className={styles.card}>
          <div className={styles.item} onClick={() => dispatch({ type: 'OPEN_SUBSCRIPTION_MODAL' })}>
            <div className={styles.itemLeft}>
              <Crown size={18} className={styles.icon} style={{ color: '#863BFF' }} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Membership Tier
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {state.user?.tier === 'pro' ? 'Kaelo Pro Active' : state.user?.tier === 'plus' ? 'Kaelo Plus Active' : 'Starter Plan (Free)'}
                </div>
              </div>
            </div>
            <div className={styles.itemRight}>
              <span className={styles.valueHighlight} style={{ textTransform: 'uppercase' }}>
                {state.user?.tier || 'Free'}
              </span>
              <ChevronRight size={16} className={styles.chevron} />
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.item} onClick={() => dispatch({ type: 'OPEN_REWARDS_MODAL' })}>
            <div className={styles.itemLeft}>
              <Gift size={18} className={styles.icon} style={{ color: 'var(--kaelo-lime-dark, #8EB81E)' }} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  XP Perks & Rewards Shop
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Redeem earned XP for digital benefits & passes
                </div>
              </div>
            </div>
            <div className={styles.itemRight}>
              <span className={styles.valueHighlight}>
                {(state.user?.xp || 0).toLocaleString()} XP
              </span>
              <ChevronRight size={16} className={styles.chevron} />
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.item} onClick={() => dispatch({ type: 'OPEN_SQUAD_MODAL' })}>
            <div className={styles.itemLeft}>
              <Users size={18} className={styles.icon} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Accountability Squad
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {state.squad?.name || 'Private Focus Squad'}
                </div>
              </div>
            </div>
            <div className={styles.itemRight}>
              <span className={styles.valueHighlight}>
                {state.squad?.members?.length || 3} Members
              </span>
              <ChevronRight size={16} className={styles.chevron} />
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.item} onClick={() => dispatch({ 
            type: 'OPEN_SHARE_MODAL',
            payload: {
              title: `Kaelo Executor: ${state.user?.name || 'Fred'}`,
              description: `Building consistent daily habits. Join my accountability squad.`
            }
          })}>
            <div className={styles.itemLeft}>
              <Share2 size={18} className={styles.icon} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Invite & Refer Friends
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Earn +250 XP bonus for each friend who executes
                </div>
              </div>
            </div>
            <div className={styles.itemRight}>
              <span className={styles.valueHighlight}>
                {state.referralCode || 'FRED84'}
              </span>
              <ChevronRight size={16} className={styles.chevron} />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.group}>
        <h3 className={styles.groupTitle}>Account & Cloud Sync</h3>
        <div className={styles.card}>
          <div className={styles.item} onClick={() => setIsAuthModalOpen(true)}>
            <div className={styles.itemLeft}>
              <Mail size={18} className={styles.icon} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {state.user?.email || 'Connect Account'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {state.user?.authProvider === 'google' ? 'Google Account Connected' : state.user?.authProvider === 'email' ? 'Email Verified' : 'Tap to sync with Google or Email'}
                </div>
              </div>
            </div>
            <div className={styles.itemRight}>
              <span className={styles.valueHighlight} style={{ textTransform: 'capitalize' }}>
                {state.user?.authProvider || 'Connect'}
              </span>
              <ChevronRight size={16} className={styles.chevron} />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.group}>
        <h3 className={styles.groupTitle}>Identity & Data</h3>
        <div className={styles.card}>
          <div className={styles.item} onClick={() => setEditingIdentity(true)}>
            <div className={styles.itemLeft}>
              <User size={18} className={styles.icon} />
              <span>Edit Identity & Name</span>
            </div>
            <div className={styles.itemRight}>
              <ChevronRight size={16} className={styles.chevron} />
            </div>
          </div>
          <div className={styles.divider} />
          <div className={styles.item} onClick={() => navigate('/onboarding')}>
            <div className={styles.itemLeft}>
              <Sparkles size={18} className={styles.icon} />
              <span>Experience Onboarding Again</span>
            </div>
            <div className={styles.itemRight}>
              <ChevronRight size={16} className={styles.chevron} />
            </div>
          </div>
          <div className={styles.divider} />
          <div className={styles.item} onClick={handleResetData}>
            <div className={styles.itemLeft}>
              <Database size={18} className={styles.dangerIcon} />
              <span className={styles.dangerText}>Reset All Data & Reboard</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Schedule Modal */}
      {editingSchedule && (
        <Modal isOpen={true} onClose={() => setEditingSchedule(false)} title="Adjust Schedule & Capacity">
          <form onSubmit={handleSaveSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>SLEEP (HOURS / DAY)</label>
              <input 
                type="number" 
                min="4" 
                max="12" 
                step="0.5"
                value={sleepHours} 
                onChange={e => setSleepHours(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid var(--border-color)', background: 'var(--bg-card-subtle)', color: 'var(--text-primary)', fontWeight: 600 }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>WORK / SCHOOL (HOURS / DAY)</label>
              <input 
                type="number" 
                min="0" 
                max="16" 
                step="0.5"
                value={workHours} 
                onChange={e => setWorkHours(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid var(--border-color)', background: 'var(--bg-card-subtle)', color: 'var(--text-primary)', fontWeight: 600 }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>FIXED COMMITMENTS (HOURS / DAY)</label>
              <input 
                type="number" 
                min="0" 
                max="10" 
                step="0.5"
                value={fixedHours} 
                onChange={e => setFixedHours(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid var(--border-color)', background: 'var(--bg-card-subtle)', color: 'var(--text-primary)', fontWeight: 600 }}
              />
            </div>
            <div style={{ padding: '12px', background: 'rgba(199, 255, 53, 0.15)', border: '1px solid rgba(199, 255, 53, 0.4)', borderRadius: '12px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Calculated Capacity: {Math.max(0, 24 - Number(sleepHours) - Number(workHours) - Number(fixedHours)).toFixed(1)}h available per day
            </div>
            <Button type="submit" variant="primary" fullWidth size="lg">
              SAVE CAPACITY
            </Button>
          </form>
        </Modal>
      )}

      {/* Edit Identity Modal */}
      {editingIdentity && (
        <Modal isOpen={true} onClose={() => setEditingIdentity(false)} title="Edit Identity">
          <form onSubmit={handleSaveIdentity} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>YOUR NAME</label>
              <input 
                type="text" 
                value={userName} 
                onChange={e => setUserName(e.target.value)}
                placeholder="Fred"
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid var(--border-color)', background: 'var(--bg-card-subtle)', color: 'var(--text-primary)', fontWeight: 600 }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>WHO ARE YOU BECOMING?</label>
              <input 
                type="text" 
                value={userIdentity} 
                onChange={e => setUserIdentity(e.target.value)}
                placeholder="I'm becoming a consistent builder."
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid var(--border-color)', background: 'var(--bg-card-subtle)', color: 'var(--text-primary)', fontWeight: 600 }}
              />
            </div>
            <Button type="submit" variant="primary" fullWidth size="lg">
              SAVE IDENTITY
            </Button>
          </form>
        </Modal>
      )}

      {/* Learned Coach Memory Modal */}
      {isMemoryModalOpen && (
        <Modal 
          isOpen={true} 
          onClose={() => setIsMemoryModalOpen(false)} 
          title="Kaelo Coach Memory"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ 
              padding: '12px', 
              background: 'rgba(199, 255, 53, 0.12)', 
              border: '1px solid rgba(199, 255, 53, 0.35)', 
              borderRadius: '12px', 
              fontSize: '12.5px', 
              color: 'var(--text-primary)',
              lineHeight: 1.45
            }}>
              <strong>How Kaelo learns:</strong> As you execute missions, Kaelo analyzes your pace, resistance patterns, and peak focus times to customize coaching. You can remove any insight or add explicit rules below.
            </div>

            {/* List of active memory insights */}
            {(!state.memory || state.memory.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                No memory records stored yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {state.memory.map((item) => (
                  <div key={item.id} className={styles.memoryCard}>
                    <div className={styles.memoryCardHeader}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className={styles.memoryCategoryBadge}>
                          {item.category?.toUpperCase() || 'HABIT'}
                        </span>
                        <span className={styles.memoryTitle}>{item.title}</span>
                      </div>
                      <button
                        type="button"
                        className={styles.memoryDeleteBtn}
                        onClick={() => dispatch({ type: 'DELETE_MEMORY_ITEM', payload: item.id })}
                        title="Forget this insight"
                        aria-label="Forget this insight"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className={styles.memoryDetail}>{item.detail}</p>
                    <div className={styles.memoryMeta}>
                      <span>{item.dateAdded || 'Auto-learned'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Custom Memory Note Form */}
            <form onSubmit={handleAddMemory} className={styles.addMemoryContainer}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <Plus size={14} style={{ color: 'var(--text-primary)' }} />
                <h4 style={{ fontSize: '12px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
                  TELL KAELO ABOUT YOU
                </h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input 
                  type="text" 
                  value={newMemoryTitle}
                  onChange={(e) => setNewMemoryTitle(e.target.value)}
                  placeholder="Title (e.g. Hard Stop at 7 PM)"
                  className={styles.memoryInput}
                />
                <textarea 
                  rows={2}
                  value={newMemoryDetail}
                  onChange={(e) => setNewMemoryDetail(e.target.value)}
                  placeholder="Detail (e.g. I attend training at 7 PM so never schedule critical missions past 6 PM)"
                  className={styles.memoryTextarea}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <select 
                    value={newMemoryCategory}
                    onChange={(e) => setNewMemoryCategory(e.target.value)}
                    className={styles.memorySelect}
                  >
                    <option value="habits">Habits</option>
                    <option value="execution">Execution</option>
                    <option value="coaching">Coaching</option>
                    <option value="capacity">Capacity</option>
                    <option value="personal">Personal</option>
                  </select>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    size="sm"
                    disabled={!newMemoryTitle.trim() || !newMemoryDetail.trim()}
                  >
                    SAVE TO KAELO
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* Auth Modal for syncing Google/Email */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        initialMode={state.user?.authProvider === 'google' ? 'google' : 'email'} 
      />
    </div>
  );
};

export default SettingsSection;
