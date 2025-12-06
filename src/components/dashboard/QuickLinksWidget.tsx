
import React from 'react';
import {
    ChartLineData01Icon,
    ChampionIcon,
    UserMultiple02Icon,
    Activity01Icon,
    ArrowRight01Icon
} from 'hugeicons-react';

const QuickLinksWidget = () => {
    const links = [
        {
            title: "Championship Progression",
            icon: <ChartLineData01Icon className="w-8 h-8 text-red-500" />,
            path: "#", // Placeholder
            description: "Analyse points evolution"
        },
        {
            title: "All-time Stats",
            icon: <ChampionIcon className="w-8 h-8 text-yellow-500" />,
            path: "#", // Placeholder
            description: "Historical records & data"
        },
        {
            title: "Head-to-Head",
            icon: <UserMultiple02Icon className="w-8 h-8 text-blue-500" />,
            path: "#", // Placeholder
            description: "Driver vs Driver comparison"
        },
        {
            title: "Team Pace Analysis",
            icon: <Activity01Icon className="w-8 h-8 text-green-500" />,
            path: "#", // Placeholder
            description: "Season performance graph"
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {links.map((link, index) => (
                <div
                    key={index}
                    className="bg-black border-2 border-gray-800 p-6 flex flex-col justify-between relative overflow-hidden opacity-80 cursor-not-allowed group"
                >
                    {/* Background decoration */}


                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-gray-900/50 w-fit p-3 rounded-lg border border-gray-800 transition-colors grayscale">
                                {link.icon}
                            </div>
                            <span className="bg-yellow-500/10 text-yellow-500 text-[10px] font-bold px-2 py-1 rounded border border-yellow-500/20 uppercase tracking-widest">
                                Cooking
                            </span>
                        </div>
                        <h3 className="text-lg font-black uppercase italic tracking-tighter text-gray-400 mb-1">
                            {link.title}
                        </h3>
                        <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">
                            {link.description}
                        </p>
                    </div>

                    <div className="mt-6 flex items-center text-xs font-bold uppercase tracking-widest text-gray-700">
                        Coming Soon
                    </div>
                </div>
            ))}
        </div>
    );
};

export default QuickLinksWidget;
