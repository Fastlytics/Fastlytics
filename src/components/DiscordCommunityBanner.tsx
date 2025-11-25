import React from 'react';
import { ArrowRight, Users, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DiscordCommunityBannerProps {
  className?: string;
}

const DiscordCommunityBanner: React.FC<DiscordCommunityBannerProps> = ({
  className
}) => {
  return (
    <div className={cn(
      "bg-gradient-to-r from-gray-900 via-gray-900/95 to-gray-900 text-white py-4 px-5 rounded-lg shadow-lg border border-gray-700/50 mb-6 relative backdrop-blur-sm",
      className
    )}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Accurate Discord logo SVG */}
        <div className="flex-shrink-0 bg-[#5865F2]/10 p-3 rounded-full border border-[#5865F2]/20">
          <svg 
            width="28" 
            height="22" 
            viewBox="0 0 28 22" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7 text-[#5865F2]"
          >
            <path d="M23.7187 1.84344C21.9054 0.997185 19.9603 0.380116 17.9207 0.0309116C17.8975 0.0262264 17.8743 0.0356183 17.863 0.0567879C17.6189 0.486116 17.3476 1.04356 17.1549 1.48388C15.003 1.15824 12.8628 1.15824 10.7544 1.48388C10.5617 1.0388 10.2811 0.486116 10.0354 0.0567879C10.0242 0.0371612 10.001 0.0277693 9.97778 0.0309116C7.93906 0.379178 5.99406 0.996247 4.17968 1.84344C4.17031 1.84813 4.16187 1.85563 4.15625 1.86501C0.607492 7.15138 -0.362915 12.2988 0.112492 17.3902C0.114367 17.4089 0.124054 17.4277 0.137492 17.4387C2.46406 19.178 4.71562 20.2589 6.92187 20.9761C6.94531 20.9839 6.97031 20.9761 6.98437 20.9574C7.49843 20.238 7.9594 19.4801 8.35625 18.6839C8.37187 18.6527 8.35625 18.6152 8.32343 18.6027C7.59375 18.3199 6.89687 17.9801 6.22812 17.5949C6.19218 17.573 6.18906 17.5215 6.22187 17.4965C6.35781 17.3933 6.49375 17.2855 6.62343 17.1762C6.6375 17.1652 6.65625 17.1621 6.67187 17.1699C11.0772 19.2324 15.8344 19.2324 20.1844 17.1699C20.2 17.1621 20.2187 17.1652 20.2328 17.1777C20.3625 17.2855 20.4984 17.3933 20.6359 17.4965C20.6687 17.5215 20.6672 17.573 20.6312 17.5949C19.9625 17.9886 19.2656 18.3199 18.5344 18.6011C18.5016 18.6136 18.4875 18.6527 18.5031 18.6839C18.9094 19.4801 19.3703 20.2363 19.8734 20.9558C19.8859 20.9761 19.9125 20.9839 19.9359 20.9761C22.1531 20.2589 24.4047 19.178 26.7312 17.4387C26.7453 17.4277 26.7547 17.4105 26.7562 17.3917C27.3297 11.5152 25.7937 6.41267 23.8234 1.86657C23.8187 1.85563 23.8102 1.84813 23.7984 1.84344H23.7187ZM9.0625 14.2652C7.7125 14.2652 6.60312 13.0351 6.60312 11.5277C6.60312 10.0199 7.69375 8.79013 9.0625 8.79013C10.4422 8.79013 11.5422 10.0324 11.5312 11.5277C11.5312 13.0351 10.4312 14.2652 9.0625 14.2652ZM18.9609 14.2652C17.6109 14.2652 16.5015 13.0351 16.5015 11.5277C16.5015 10.0199 17.5922 8.79013 18.9609 8.79013C20.3406 8.79013 21.4406 10.0324 21.4297 11.5277C21.4297 13.0351 20.3406 14.2652 18.9609 14.2652Z" fill="currentColor"/>
          </svg>
        </div>
        
        <div className="flex-1">
          <h3 className="font-bold text-lg text-white mb-2">Join Our Discord Community!</h3>
          <p className="text-gray-300 mb-3">Connect with other F1 fans, discuss races, share analysis, and get the latest updates from the Fastlytics team. We're building a community of passionate Formula 1 fans who love data.</p>
          
          <div className="flex flex-wrap gap-4 mt-2">
            <div className="flex items-center gap-2 bg-gray-800/70 px-3 py-1.5 rounded-md border border-gray-700/50">
              <Users className="h-4 w-4 text-red-400" />
              <span className="text-gray-200 text-sm">100+ Members</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-800/70 px-3 py-1.5 rounded-md border border-gray-700/50">
              <MessageCircle className="h-4 w-4 text-red-400" />
              <span className="text-gray-200 text-sm">Active Discussions</span>
            </div>
            <a 
              href="https://discord.gg/bSEGSMwFDn" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-[#5865F2]/90 hover:bg-[#5865F2] text-white font-medium px-4 py-1.5 rounded-md transition-colors duration-200"
            >
              Join now <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscordCommunityBanner; 