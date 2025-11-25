export const clearDonationPopupSettings = () => {
  localStorage.removeItem('kofiDonationDontShow');
  localStorage.removeItem('kofiDonationRemindLater');
  sessionStorage.removeItem('kofiPopupShownThisSession');
  console.log('Donation popup settings cleared.');
};
