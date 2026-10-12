import React from 'react';
import { motion } from 'framer-motion';
import { Home, MapPin, Tag, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';
import styles from './ListingDraftCard.module.css';

const ListingDraftCard = ({ draft, onConfirm, onCancel, onEdit }) => {
  if (!draft) return null;

  const isAwaiting = draft.status === 'AWAITING_CONFIRMATION' || draft.status === 'awaiting_confirmation';
  const isPublished = draft.status === 'published' || draft.status === 'SUCCESS';

  return (
    <motion.div 
      className={styles.card}
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className={styles.header}>
        <div className={styles.badgeRow}>
          <span className={styles.propertyBadge}>
            <Home size={13} />
            {draft.property_type || 'Property Listing'}
          </span>
          {draft.location && (
            <span className={styles.locationBadge}>
              <MapPin size={12} />
              {draft.location}
            </span>
          )}
        </div>

        {isPublished ? (
          <span className={styles.statusLive}>
            <CheckCircle2 size={13} /> LIVE
          </span>
        ) : (
          <span className={styles.statusDraft}>
            <Sparkles size={12} /> DRAFT
          </span>
        )}
      </div>

      <div className={styles.titleSection}>
        <h4 className={styles.listingTitle}>
          {draft.title || `${draft.bedrooms || ''} Bed ${draft.property_type || 'Listing'} in ${draft.location || 'Nigeria'}`}
        </h4>
        {draft.price && (
          <div className={styles.priceRow}>
            <span className={styles.priceAmount}>
              ₦{Number(draft.price).toLocaleString()}
            </span>
            <span className={styles.priceUnit}>
              / {draft.pricing_unit || 'night'}
            </span>
          </div>
        )}
      </div>

      {/* Amenities Chips */}
      {draft.amenities && draft.amenities.length > 0 && (
        <div className={styles.amenitiesGrid}>
          {draft.amenities.map((item, idx) => (
            <span key={idx} className={styles.amenityChip}>
              {item}
            </span>
          ))}
        </div>
      )}

      {/* Booking conditions */}
      {draft.booking_conditions && (
        <div className={styles.bookingNote}>
          <Tag size={12} /> {draft.booking_conditions}
        </div>
      )}

      {/* Confirmation Actions */}
      {isAwaiting && (
        <div className={styles.actionsBar}>
          <button 
            type="button"
            className={styles.confirmBtn}
            onClick={onConfirm}
          >
            <CheckCircle2 size={15} /> Yes, Create Listing
          </button>
          <button 
            type="button"
            className={styles.cancelBtn}
            onClick={onCancel}
          >
            <X size={15} /> Cancel
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default ListingDraftCard;
