import React, { useState } from 'react';
import { Tick01Icon, CheckmarkCircle02Icon, StarIcon } from 'hugeicons-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import LandingNavbar from '@/components/LandingNavbar';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobilePricing } from '@/components/mobile';

const Pricing = () => {
    const isMobile = useIsMobile();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'biannual' | 'yearly'>('monthly');

    if (isMobile) {
        return <MobilePricing />;
    }

    const proPrices = {
        monthly: { price: 6.99, label: '/mo', period: 'Monthly' },
        quarterly: { price: 19.99, label: '/3 mo', period: 'Quarterly' },
        biannual: { price: 32.99, label: '/6 mo', period: 'Semi-Annual' },
        yearly: { price: 59.99, label: '/yr', period: 'Yearly' },
    };

    const currentPro = proPrices[billingCycle];

    return (
        <div className="min-h-screen bg-black text-white selection:bg-red-600 selection:text-white">
            <LandingNavbar />
            <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 font-sans">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-6">
                            Choose Your <span className="text-red-600">Pace</span>
                        </h1>
                        <p className="text-xl text-gray-400 font-mono max-w-2xl mx-auto">
                            Unlock advanced telemetry and gain the competitive edge.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto items-start">
                        {/* Free Plan */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                            className="bg-gray-900/50 border-2 border-gray-800 p-8 flex flex-col relative group hover:border-gray-600 transition-all duration-300 rounded-xl overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gray-800 group-hover:bg-gray-600 transition-colors" />

                            <div className="mb-8">
                                <h3 className="text-2xl font-bold uppercase mb-2 text-gray-300">Standard</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-black">Free</span>
                                </div>
                                <p className="text-gray-500 font-mono mt-2 text-sm">Essential telemetry for casual analysis.</p>
                            </div>

                            <ul className="space-y-4 mb-8 flex-grow font-mono text-sm text-gray-400">
                                <li className="flex items-center gap-3">
                                    <Tick01Icon className="w-5 h-5 text-gray-500" />
                                    <span>Standard Telemetry Data</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Tick01Icon className="w-5 h-5 text-gray-500" />
                                    <span>Race Results & Standings</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Tick01Icon className="w-5 h-5 text-gray-500" />
                                    <span>Basic Lap Times</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Tick01Icon className="w-5 h-5 text-gray-500" />
                                    <span>Driver Comparison (Basic)</span>
                                </li>
                            </ul>

                            <Button className="w-full bg-transparent border-2 border-white text-white font-bold uppercase hover:bg-white hover:text-black rounded-lg py-6 tracking-wider transition-all">
                                Get Started
                            </Button>
                        </motion.div>

                        {/* Pro Plan */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="bg-gradient-to-b from-gray-900 to-black border-2 border-red-600 p-8 flex flex-col relative shadow-[0_0_50px_rgba(220,38,38,0.15)] rounded-xl overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-red-600" />
                            <div className="absolute top-4 right-4">
                                <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 uppercase rounded-full tracking-wider flex items-center gap-1">
                                    <StarIcon className="w-3 h-3 fill-current" /> Recommended
                                </span>
                            </div>

                            <div className="mb-8">
                                <h3 className="text-2xl font-bold uppercase mb-2 text-red-500 flex items-center gap-2">
                                    Pro <span className="text-white text-sm bg-red-600/20 px-2 py-0.5 rounded border border-red-600/30">All Access</span>
                                </h3>

                                <div className="flex items-baseline gap-1 mt-4">
                                    <span className="text-5xl font-black tracking-tight">${currentPro.price}</span>
                                    <span className="text-gray-400 font-mono text-lg">{currentPro.label}</span>
                                </div>
                                <p className="text-gray-400 font-mono mt-2 text-sm">Advanced tools for serious analysis.</p>
                            </div>

                            {/* Billing Cycle Selector */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
                                {(Object.keys(proPrices) as Array<keyof typeof proPrices>).map((cycle) => (
                                    <button
                                        key={cycle}
                                        onClick={() => setBillingCycle(cycle)}
                                        className={cn(
                                            "px-2 py-2 text-xs font-bold uppercase rounded border transition-all duration-200",
                                            billingCycle === cycle
                                                ? "bg-red-600 border-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.4)]"
                                                : "bg-transparent border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white"
                                        )}
                                    >
                                        {proPrices[cycle].period}
                                    </button>
                                ))}
                            </div>

                            <ul className="space-y-4 mb-8 flex-grow font-mono text-sm text-gray-300">
                                <li className="flex items-center gap-3">
                                    <CheckmarkCircle02Icon className="w-5 h-5 text-red-500" />
                                    <span className="font-bold text-white">Advanced Telemetry</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckmarkCircle02Icon className="w-5 h-5 text-red-500" />
                                    <span>Session Replay</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckmarkCircle02Icon className="w-5 h-5 text-red-500" />
                                    <span>Time Synced Telemetry Data</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckmarkCircle02Icon className="w-5 h-5 text-red-500" />
                                    <span>Unlimited Historical Data</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckmarkCircle02Icon className="w-5 h-5 text-red-500" />
                                    <span>Priority Support</span>
                                </li>
                            </ul>

                            <Button className="w-full bg-red-600 border-2 border-red-600 text-white font-bold uppercase hover:bg-red-700 hover:border-red-700 rounded-lg py-6 tracking-wider shadow-[0_4px_0_0_rgba(153,27,27,1)] active:shadow-none active:translate-y-[4px] transition-all">
                                Upgrade to Pro
                            </Button>

                            <p className="text-center text-xs text-gray-500 mt-4 font-mono">
                                Secure payment via Paddle. Cancel anytime.
                            </p>
                        </motion.div>
                    </div>

                    {/* FAQ or Additional Info could go here */}
                    <div className="mt-20 text-center">
                        <p className="text-gray-500 text-sm">
                            Need a custom enterprise plan? <a href="/contact" className="text-red-500 hover:underline">Contact us</a>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
