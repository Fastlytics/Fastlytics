import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PremiumLimitModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
}

export const PremiumLimitModal: React.FC<PremiumLimitModalProps> = ({ isOpen, onClose, title, description }) => {
    const navigate = useNavigate();
    const location = useLocation();

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-md bg-black border-2 border-zinc-800 p-8 flex flex-col items-center text-center overflow-hidden shadow-2xl"
                >
                    {/* Corner accents */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-red-600" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-red-600" />

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Icon */}
                    <div className="mb-6 relative">
                        <div className="absolute inset-0 bg-red-600/20 blur-xl rounded-full" />
                        <div className="relative w-12 h-12 bg-zinc-900 border-2 border-red-600 flex items-center justify-center transform rotate-3">
                            <Lock className="w-6 h-6 text-white transform -rotate-3" />
                        </div>
                    </div>

                    {/* Content */}
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white mb-2">
                        {title}
                    </h2>

                    <p className="text-zinc-400 font-mono text-sm mb-6 leading-relaxed">
                        {description}
                    </p>

                    {/* Actions */}
                    <div className="w-full space-y-3">
                        <Button
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider py-4 text-base rounded-none border-2 border-transparent hover:border-white transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                            onClick={() => navigate('/pricing', { state: { from: location.pathname + location.search } })}
                        >
                            Upgrade to Pro
                        </Button>

                        <Button
                            variant="ghost"
                            className="w-full text-zinc-500 hover:text-white font-bold uppercase tracking-widest text-xs"
                            onClick={onClose}
                        >
                            Dismiss
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
