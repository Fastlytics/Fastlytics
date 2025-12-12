import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export interface SubscriptionState {
    isPremium: boolean;
    isTrialing: boolean;
    daysRemaining: number | null;
    tier: 'free' | 'premium';
    status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'none';
    limitations: {
        maxDrivers: number;
        allowReplay: boolean;
        allowHistoricalData: boolean;
    };
}

export const useSubscription = (): SubscriptionState => {
    const { profile, loading } = useAuth();

    return useMemo(() => {
        const featureFlag = import.meta.env.VITE_ENABLE_SUBSCRIPTIONS;
        const isSubscriptionsEnabled = featureFlag === undefined || featureFlag === 'true';

        if (!isSubscriptionsEnabled) {
            return {
                isPremium: true,
                isTrialing: false,
                daysRemaining: null,
                tier: 'premium',
                status: 'active',
                limitations: {
                    maxDrivers: 20,
                    allowReplay: true,
                    allowHistoricalData: true,
                }
            };
        }

        if (loading || !profile) {
            return {
                isPremium: false,
                isTrialing: false,
                daysRemaining: null,
                tier: 'free',
                status: 'none',
                limitations: {
                    maxDrivers: 2,
                    allowReplay: false,
                    allowHistoricalData: false,
                }
            };
        }

        const today = new Date();
        const trialEnd = profile.trial_end_date ? new Date(profile.trial_end_date) : null;

        // Check if trial is active
        const isTrialActive = trialEnd ? trialEnd > today : false;

        // Check if subscription is active (or trial is active)
        // We consider them "Premium" if they are in a valid trial OR have an active paid subscription
        const hasActiveSubscription = profile.subscription_status === 'active';
        const isPremium = hasActiveSubscription || isTrialActive;

        // Calculate days remaining in trial
        let daysRemaining = null;
        if (isTrialActive && trialEnd) {
            const diffTime = Math.abs(trialEnd.getTime() - today.getTime());
            daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        // Define limitations based on calculated status
        const limitations = {
            maxDrivers: isPremium ? 20 : 2, // Free: 2, Premium: 20
            allowReplay: isPremium, // Free: No access, Premium: Full access
            allowHistoricalData: isPremium, // Free: Current season only, Premium: All history
        };

        return {
            isPremium,
            isTrialing: isTrialActive && !hasActiveSubscription,
            daysRemaining,
            tier: profile.tier || 'free',
            status: (profile.subscription_status as SubscriptionState['status']) || 'none',
            limitations
        };
    }, [profile, loading]);
};

export const startTrial = async (userId: string) => {
    const { error } = await supabase
        .from('profiles')
        .update({
            subscription_status: 'trialing',
            trial_start_date: new Date().toISOString(),
            trial_end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            tier: 'free' // Tier remains free until they actually subscribe, status is trialing
        })
        .eq('id', userId);

    if (error) throw error;
};

export const cancelTrial = async (userId: string) => {
    // End trial immediately
    const { error } = await supabase
        .from('profiles')
        .update({
            subscription_status: 'canceled',
            tier: 'free',
            trial_end_date: new Date().toISOString() // End trial now
        })
        .eq('id', userId);

    if (error) throw error;
};
