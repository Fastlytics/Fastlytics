import { logger } from '@/lib/logger';

export const clearDonationPopupSettings = () => {
  localStorage.removeItem('kofiDonationDontShow');
  localStorage.removeItem('kofiDonationRemindLater');
  sessionStorage.removeItem('kofiPopupShownThisSession');
  logger.debug('Donation popup settings cleared.');
};
