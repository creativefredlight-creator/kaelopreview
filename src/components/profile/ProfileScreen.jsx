import React from 'react';
import styles from './ProfileScreen.module.css';
import ProfileHeader from './ProfileHeader';
import SettingsSection from './SettingsSection';

const ProfileScreen = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <ProfileHeader />
        <SettingsSection />
      </div>
    </div>
  );
};

export default ProfileScreen;
