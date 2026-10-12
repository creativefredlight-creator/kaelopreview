import React from 'react';
import { Outlet } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import BottomNav from './BottomNav';
import FocusMode from '../focus/FocusMode';
import DayCompleteModal from '../today/DayCompleteModal';
import KaeloOrb from '../companion/KaeloOrb';
import KaeloVoiceCoach from '../voice/KaeloVoiceCoach';
import RewardShopModal from '../rewards/RewardShopModal';
import SubscriptionModal from '../subscription/SubscriptionModal';
import ShareCardModal from '../growth/ShareCardModal';
import SquadModal from '../growth/SquadModal';
import DayRecapModal from '../today/DayRecapModal';
import styles from './AppShell.module.css';

const AppShell = () => {
  const { state, dispatch } = useApp();
  
  return (
    <div className={styles.appShell}>
      <main className={styles.content}>
        <Outlet />
      </main>
      
      {!state.activeFocus && <BottomNav />}
      
      {/* Floating Kaelo Orb Companion */}
      {!state.activeFocus && <KaeloOrb />}

      {/* Voice Coach Overlay */}
      {state.voiceActive && <KaeloVoiceCoach />}
      
      {state.activeFocus && <FocusMode />}

      {state.dayCompleteModal && <DayCompleteModal />}

      {/* Economy, Growth & Retention Modals */}
      <RewardShopModal 
        isOpen={Boolean(state.isRewardsModalOpen)} 
        onClose={() => dispatch({ type: 'CLOSE_REWARDS_MODAL' })} 
      />

      <SubscriptionModal 
        isOpen={Boolean(state.isSubscriptionModalOpen)} 
        onClose={() => dispatch({ type: 'CLOSE_SUBSCRIPTION_MODAL' })} 
      />

      <ShareCardModal 
        isOpen={Boolean(state.isShareModalOpen)} 
        data={state.shareModalData}
        onClose={() => dispatch({ type: 'CLOSE_SHARE_MODAL' })} 
      />

      <SquadModal 
        isOpen={Boolean(state.isSquadModalOpen)} 
        onClose={() => dispatch({ type: 'CLOSE_SQUAD_MODAL' })} 
      />

      <DayRecapModal 
        isOpen={Boolean(state.isRecapModalOpen)} 
        onClose={() => dispatch({ type: 'CLOSE_RECAP_MODAL' })} 
      />
    </div>
  );
};

export default AppShell;

