import React from 'react';
import { Check } from 'lucide-react';
import { Button } from "@/components/ui/button";

const PricingSection = () => {
    return (
        <section id="pricing" className="relative py-20 bg-black">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-4">
                        Pro <span className="text-red-600">Access</span>
                    </h2>
                    <p className="text-xl text-gray-400 font-mono max-w-2xl mx-auto">
                        Unlock the full potential of telemetry analysis.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* Free Tier */}
                    <div className="bg-gray-900 border-2 border-gray-800 p-8 flex flex-col relative group hover:border-gray-600 transition-colors">
                        <div className="mb-8">
                            <h3 className="text-2xl font-bold uppercase mb-2">Rookie</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black">$0</span>
                                <span className="text-gray-500 font-mono">/mo</span>
                            </div>
                        </div>
                        <ul className="space-y-4 mb-8 flex-grow font-mono text-sm text-gray-400">
                            <li className="flex items-center gap-3">
                                <Check className="w-5 h-5 text-gray-600" />
                                <span>Race Results</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Check className="w-5 h-5 text-gray-600" />
                                <span>Driver Standings</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Check className="w-5 h-5 text-gray-600" />
                                <span>Basic Lap Times</span>
                            </li>
                        </ul>
                        <Button className="w-full bg-transparent border-2 border-white text-white font-bold uppercase hover:bg-white hover:text-black rounded-none">
                            Get Started
                        </Button>
                    </div>

                    {/* Pro Tier */}
                    <div className="bg-gray-900 border-2 border-red-600 p-8 flex flex-col relative transform md:-translate-y-4 shadow-[0_0_30px_rgba(220,38,38,0.2)]">
                        <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold px-3 py-1 uppercase">
                            Most Popular
                        </div>
                        <div className="mb-8">
                            <h3 className="text-2xl font-bold uppercase mb-2 text-red-500">Pro Driver</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black">$4.99</span>
                                <span className="text-gray-500 font-mono">/mo</span>
                            </div>
                        </div>
                        <ul className="space-y-4 mb-8 flex-grow font-mono text-sm text-gray-300">
                            <li className="flex items-center gap-3">
                                <Check className="w-5 h-5 text-red-600" />
                                <span>Everything in Rookie</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Check className="w-5 h-5 text-red-600" />
                                <span>Live Telemetry</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Check className="w-5 h-5 text-red-600" />
                                <span>Speed Traces</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Check className="w-5 h-5 text-red-600" />
                                <span>Tire Strategy Analysis</span>
                            </li>
                        </ul>
                        <Button className="w-full bg-red-600 border-2 border-red-600 text-white font-bold uppercase hover:bg-red-700 hover:border-red-700 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">
                            Go Pro
                        </Button>
                    </div>

                    {/* Team Tier */}
                    <div className="bg-gray-900 border-2 border-gray-800 p-8 flex flex-col relative group hover:border-gray-600 transition-colors">
                        <div className="mb-8">
                            <h3 className="text-2xl font-bold uppercase mb-2">Team Principal</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black">$49.99</span>
                                <span className="text-gray-500 font-mono">/yr</span>
                            </div>
                        </div>
                        <ul className="space-y-4 mb-8 flex-grow font-mono text-sm text-gray-400">
                            <li className="flex items-center gap-3">
                                <Check className="w-5 h-5 text-white" />
                                <span>All Pro Features</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Check className="w-5 h-5 text-white" />
                                <span>2 Months Free</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Check className="w-5 h-5 text-white" />
                                <span>Priority Support</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Check className="w-5 h-5 text-white" />
                                <span>API Access</span>
                            </li>
                        </ul>
                        <Button className="w-full bg-transparent border-2 border-white text-white font-bold uppercase hover:bg-white hover:text-black rounded-none">
                            Contact Sales
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PricingSection;
