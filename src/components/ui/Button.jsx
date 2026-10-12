import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import styles from './Button.module.css';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  loading = false,
  disabled = false,
  onClick,
  className = '',
  type = 'button',
  ...props
}) => {
  // Map alternative variant names
  const variantMap = { lime: 'primary', large: 'lg' };
  const resolvedVariant = variantMap[variant] || variant;
  const resolvedSize = size === 'large' ? 'lg' : size === 'small' ? 'sm' : size;

  const baseClass = styles.button;
  const variantClass = styles[`variant-${resolvedVariant}`];
  const sizeClass = styles[`size-${resolvedSize}`];
  const fullWidthClass = fullWidth ? styles.fullWidth : '';

  const classes = [baseClass, variantClass, sizeClass, fullWidthClass, className]
    .filter(Boolean)
    .join(' ');

  // Support icon as either a React element or a component
  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    const IconComponent = icon;
    return <IconComponent size={18} />;
  };

  return (
    <motion.button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={!(disabled || loading) ? { scale: 0.97 } : {}}
      {...props}
    >
      {loading && <Loader2 className={styles.spinner} size={18} />}
      {!loading && renderIcon()}
      <span className={styles.text}>{children}</span>
    </motion.button>
  );
};

export { Button };
export default Button;
