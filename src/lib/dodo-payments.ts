let dodoPaymentsInitialized = false;

export function initDodoPayments() {
  if (dodoPaymentsInitialized) return;
  dodoPaymentsInitialized = true;
}

export async function openDodoCheckout(checkoutUrl: string): Promise<void> {
  const DodoPayments = (
    window as unknown as {
      DodoPayments?: { Checkout: { open: (opts: { checkoutUrl: string }) => Promise<void> } };
    }
  ).DodoPayments;
  if (!DodoPayments) {
    window.open(checkoutUrl, '_blank');
    return;
  }

  try {
    await DodoPayments.Checkout.open({ checkoutUrl });
  } catch {
    window.location.href = checkoutUrl;
  }
}

export function loadDodoScript(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as unknown as { DodoPayments?: unknown }).DodoPayments) {
      initDodoPayments();
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.dodopayments.com/checkout.js';
    script.async = true;
    script.onload = () => {
      initDodoPayments();
      resolve();
    };
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
}
