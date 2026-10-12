import React from 'react';
import styles from './Badge.module.css';

const Badge = ({
  children,
  text,
  variant = 'lime',
  size = 'md',
  icon: Icon,
  className = '',
}) => {
  const content = children !== undefined ? children : text;
  const variantMap = { primary: 'lime', outline: 'outlined', dark: 'gray' };
  const resolvedVariant = variantMap[variant] || variant;

  const baseClass = styles.badge;
  const variantClass = styles[`variant-${resolvedVariant}`] || styles['variant-lime'];
  const sizeClass = styles[`size-${size}`] || styles['size-md'];

  const classes = [baseClass, variantClass, sizeClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      {Icon && <Icon className={styles.icon} size={size === 'sm' ? 12 : 16} />}
      <span className={styles.text}>{content}</span>
    </div>
  );
};

export { Badge };
export default Badge;
