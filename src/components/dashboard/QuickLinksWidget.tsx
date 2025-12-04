
import React from 'react';
import { Link } from 'react-router-dom';
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
                <Link
                    key={index}
                    to={link.path}
                    className="bg-black border-2 border-gray-800 p-6 flex flex-col justify-between group hover:border-red-600/50 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
                >
                    {/* Background decoration */}


                    <div className="relative z-10">
                        <div className="mb-4 bg-gray-900/50 w-fit p-3 rounded-lg border border-gray-800 group-hover:border-gray-700 transition-colors">
                            {link.icon}
                        </div>
                        <h3 className="text-lg font-black uppercase italic tracking-tighter text-white mb-1 group-hover:text-red-500 transition-colors">
                            {link.title}
                        </h3>
                        <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">
                            {link.description}
                        </p>
                    </div>

                    <div className="mt-6 flex items-center text-xs font-bold uppercase tracking-widest text-gray-600 group-hover:text-white transition-colors">
                        View <ArrowRight01Icon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>
            ))}
        </div>
    );
};

export default QuickLinksWidget;
