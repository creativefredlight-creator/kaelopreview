import React from 'react';
import styles from './Card.module.css';

const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick,
  ...props
}) => {
  const baseClass = styles.card;
  const variantClass = styles[`variant-${variant}`];
  const paddingClass = styles[`padding-${padding}`];
  const clickableClass = onClick ? styles.clickable : '';

  const classes = [baseClass, variantClass, paddingClass, clickableClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} onClick={onClick} {...props}>
      {children}
    </div>
  );
};

export { Card };
export default Card;
