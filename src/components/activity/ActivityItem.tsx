import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flag01Icon,
  Analytics01Icon,
  UserIcon,
  UserGroupIcon,
  FlashIcon,
  SecurityCheckIcon,
} from 'hugeicons-react';
import { StarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCurrentSeasonYear } from '@/lib/seasonUtils';
import { getDriverImage as getDriverImageFromMapping } from '@/utils/imageMapping';

export interface ActivityItemProps {
  activity: {
    id: string;
    event_name: string;
    event_data: Record<string, unknown>;
    created_at: string;
  };
  drivers?: never[];
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  const navigate = useNavigate();
  const { event_name, event_data, created_at } = activity;
  const date = new Date(created_at);
  const timeString =
    date.toLocaleDateString() +
    ', ' +
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Helper to get driver image
  const getDriverImage = (driverCodeOrName: string) => {
    if (!driverCodeOrName) return null;
    return getDriverImageFromMapping(driverCodeOrName, getCurrentSeasonYear()) || null;
  };

  // Helper to get country code from race name (simplified mapping)
  const getCountryCode = (raceName: string) => {
    if (!raceName) return null;
    const lower = raceName.toLowerCase();
    if (lower.includes('bahrain')) return 'bh';
    if (lower.includes('saudi')) return 'sa';
    if (lower.includes('australia')) return 'au';
    if (lower.includes('japan')) return 'jp';
    if (lower.includes('china')) return 'cn';
    if (lower.includes('miami')) return 'us';
    if (lower.includes('emilia')) return 'it';
    if (lower.includes('monaco')) return 'mc';
    if (lower.includes('canada')) return 'ca';
    if (lower.includes('spain')) return 'es';
    if (lower.includes('austria')) return 'at';
    if (lower.includes('britain') || lower.includes('british')) return 'gb';
    if (lower.includes('hungary')) return 'hu';
    if (lower.includes('belgium')) return 'be';
    if (lower.includes('netherlands') || lower.includes('dutch')) return 'nl';
    if (lower.includes('italy') || lower.includes('italian')) return 'it';
    if (lower.includes('azerbaijan')) return 'az';
    if (lower.includes('singapore')) return 'sg';
    if (lower.includes('austin') || lower.includes('united states')) return 'us';
    if (lower.includes('mexico')) return 'mx';
    if (lower.includes('brazil')) return 'br';
    if (lower.includes('vegas')) return 'us';
    if (lower.includes('qatar')) return 'qa';
    if (lower.includes('abu dhabi')) return 'ae';
    return null;
  };

  // Render logic based on event type
  let content = null;
  let onClick = () => {};

  switch (event_name) {
    case 'race_analysis_viewed':
    case 'mobile_race_analysis_viewed': {
      const data = event_data as { race: string; year: number };
      const raceName = data.race;
      const year = data.year;
      const countryCode = getCountryCode(raceName);

      content = (
        <div className="flex items-center gap-4">
          <div className="w-12 h-8 bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden rounded shadow-sm">
            {countryCode ? (
              <img
                src={`https://flagcdn.com/h40/${countryCode}.png`}
                alt={raceName}
                className="w-full h-full object-cover"
              />
            ) : (
              <Flag01Icon className="w-5 h-5 text-zinc-500" />
            )}
          </div>
          <div>
            <div className="font-bold text-white text-sm">Viewed {raceName}</div>
            <div className="text-xs text-zinc-500">Analysis • {year}</div>
          </div>
        </div>
      );
      onClick = () => {
        const slug = `${year}-${raceName.toLowerCase().replace(/\s+/g, '-')}`;
        navigate(`/race/${slug}?view=analysis`);
      };
      break;
    }

    case 'race_details_view':
    case 'mobile_race_details_view': {
      const data = event_data as { race_name: string; year: number };
      const raceDetailsName = data.race_name;
      const raceDetailsYear = data.year;
      const raceDetailsCode = getCountryCode(raceDetailsName);

      content = (
        <div className="flex items-center gap-4">
          <div className="w-12 h-8 bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden rounded shadow-sm">
            {raceDetailsCode ? (
              <img
                src={`https://flagcdn.com/h40/${raceDetailsCode}.png`}
                alt={raceDetailsName}
                className="w-full h-full object-cover"
              />
            ) : (
              <Flag01Icon className="w-5 h-5 text-zinc-500" />
            )}
          </div>
          <div>
            <div className="font-bold text-white text-sm">Viewed {raceDetailsName}</div>
            <div className="text-xs text-zinc-500">Race Hub • {raceDetailsYear}</div>
          </div>
        </div>
      );
      onClick = () => {
        const slug = `${raceDetailsYear}-${raceDetailsName.toLowerCase().replace(/\s+/g, '-')}`;
        navigate(`/race/${slug}`);
      };
      break;
    }

    case 'driver_comparison': {
      const data = event_data as {
        driver_1: string;
        driver_2: string;
        telemetry_type: string;
        circuit?: string;
      };
      const d1 = data.driver_1;
      const d2 = data.driver_2;
      const img1 = getDriverImage(d1);
      const img2 = getDriverImage(d2);

      content = (
        <div className="flex items-center gap-4">
          <div className="flex items-center -space-x-3">
            <div className="w-10 h-10 rounded-full border-2 border-black bg-zinc-800 overflow-hidden z-10">
              {img1 ? (
                <img src={img1} alt={d1} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-full h-full p-2 text-zinc-500" />
              )}
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-black bg-zinc-800 overflow-hidden z-0">
              {img2 ? (
                <img src={img2} alt={d2} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-full h-full p-2 text-zinc-500" />
              )}
            </div>
          </div>
          <div>
            <div className="font-bold text-white text-sm">
              Compared {d1} vs {d2}
            </div>
            <div className="text-xs text-zinc-500 capitalize">{data.telemetry_type} Telemetry</div>
          </div>
        </div>
      );
      // We need to know which race/circuit this was on to link back properly.
      // The event data has 'circuit'.
      onClick = () => {
        if (data.circuit) {
          // Assuming circuit name can be mapped to race slug or we have year
          // If year is missing, we might default to current year or 2024
          const year = getCurrentSeasonYear(); // Fallback
          const slug = `${year}-${data.circuit.toLowerCase().replace(/\s+/g, '-')}`;
          navigate(`/race/${slug}?view=analysis&tab=telemetry`);
        }
      };
      break;
    }

    case 'driver_profile_view': {
      const data = event_data as { driver_name: string; driver_id: string };
      const driverName = data.driver_name;
      const driverId = data.driver_id;
      const driverImg = getDriverImage(driverName);

      content = (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full border border-zinc-700 bg-zinc-800 overflow-hidden">
            {driverImg ? (
              <img src={driverImg} alt={driverName} className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-full h-full p-2 text-zinc-500" />
            )}
          </div>
          <div>
            <div className="font-bold text-white text-sm">Viewed {driverName}</div>
            <div className="text-xs text-zinc-500">Driver Profile</div>
          </div>
        </div>
      );
      onClick = () => {}; // Disabled driver details
      break;
    }

    case 'team_profile_view': {
      const data = event_data as { team_name: string; team_id: string };
      const teamName = data.team_name;
      const teamId = data.team_id;

      content = (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full border border-zinc-700 bg-zinc-800 flex items-center justify-center">
            <UserGroupIcon className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <div className="font-bold text-white text-sm">Viewed {teamName}</div>
            <div className="text-xs text-zinc-500">Team Profile</div>
          </div>
        </div>
      );
      onClick = () => navigate(`/team/${teamId}`);
      break;
    }

    case 'tab_switched': {
      const data = event_data as { tab: string; race_name: string; year?: number };
      const tabName = data.tab;
      const raceNameTab = data.race_name;
      const tabYear = data.year || getCurrentSeasonYear(); // Fallback if missing in old logs
      const countryCodeTab = getCountryCode(raceNameTab);

      let actionVerb = 'Viewed';
      if (['telemetry', 'strategy', 'dominance', 'positions', 'laptimes'].includes(tabName)) {
        actionVerb = 'Analysed';
      }

      content = (
        <div className="flex items-center gap-4">
          <div className="w-12 h-8 bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden rounded shadow-sm">
            {countryCodeTab ? (
              <img
                src={`https://flagcdn.com/h40/${countryCodeTab}.png`}
                alt={raceNameTab}
                className="w-full h-full object-cover"
              />
            ) : (
              <Analytics01Icon className="w-5 h-5 text-zinc-500" />
            )}
          </div>
          <div>
            <div className="font-bold text-white text-sm">
              {actionVerb} {tabName.charAt(0).toUpperCase() + tabName.slice(1)}
            </div>
            <div className="text-xs text-zinc-500">
              {raceNameTab} • {tabYear}
            </div>
          </div>
        </div>
      );
      onClick = () => {
        const slug = `${tabYear}-${raceNameTab.toLowerCase().replace(/\s+/g, '-')}`;
        navigate(`/race/${slug}?view=analysis&tab=${tabName}`);
      };
      break;
    }

    case 'session_changed':
    case 'mobile_session_changed': {
      const data = event_data as { session_type: string; race_name: string; year: number };
      const sessionType = data.session_type;
      const raceNameSession = data.race_name;
      const sessionYear = data.year;
      const countryCodeSession = getCountryCode(raceNameSession);

      content = (
        <div className="flex items-center gap-4">
          <div className="w-12 h-8 bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden rounded shadow-sm">
            {countryCodeSession ? (
              <img
                src={`https://flagcdn.com/h40/${countryCodeSession}.png`}
                alt={raceNameSession}
                className="w-full h-full object-cover"
              />
            ) : (
              <Flag01Icon className="w-5 h-5 text-zinc-500" />
            )}
          </div>
          <div>
            <div className="font-bold text-white text-sm">Viewed {sessionType} Results</div>
            <div className="text-xs text-zinc-500">
              {raceNameSession} • {sessionYear}
            </div>
          </div>
        </div>
      );
      onClick = () => {
        const slug = `${sessionYear}-${raceNameSession.toLowerCase().replace(/\s+/g, '-')}`;
        navigate(`/race/${slug}?session=${sessionType}`);
      };
      break;
    }

    case 'chart_interaction': {
      const data = event_data as { action: string; chart: string };
      const chartAction = data.action;
      const chartName = data.chart;

      content = (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full border border-zinc-700 bg-zinc-800 flex items-center justify-center">
            <FlashIcon className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <div className="font-bold text-white text-sm">
              Interacted with {chartName.replace(/_/g, ' ')}
            </div>
            <div className="text-xs text-zinc-500 capitalize">{chartAction.replace(/_/g, ' ')}</div>
          </div>
        </div>
      );
      break;
    }

    case 'favorites_updated':
      content = (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full border border-zinc-700 bg-zinc-800 flex items-center justify-center">
            <StarIcon className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <div className="font-bold text-white text-sm">Updated Favorites</div>
            <div className="text-xs text-zinc-500">Profile Settings</div>
          </div>
        </div>
      );
      break;

    case 'profile_updated': {
      const data = event_data as { field: string };
      const field = data.field;
      content = (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full border border-zinc-700 bg-zinc-800 flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <div className="font-bold text-white text-sm">Updated Profile</div>
            <div className="text-xs text-zinc-500">Changed {field}</div>
          </div>
        </div>
      );
      break;
    }

    case 'password_updated':
      content = (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full border border-zinc-700 bg-zinc-800 flex items-center justify-center">
            <SecurityCheckIcon className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <div className="font-bold text-white text-sm">Updated Password</div>
            <div className="text-xs text-zinc-500">Security Settings</div>
          </div>
        </div>
      );
      break;

    default:
      // Fallback for unknown events
      content = (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full border border-zinc-700 bg-zinc-800 flex items-center justify-center">
            <Analytics01Icon className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <div className="font-bold text-white text-sm capitalize">
              {event_name.replace(/_/g, ' ')}
            </div>
            <div className="text-xs text-zinc-500 font-mono truncate max-w-[200px]">
              {JSON.stringify(event_data)}
            </div>
          </div>
        </div>
      );
      break;
  }

  return (
    <div
      onClick={onClick}
      className="bg-black/40 border border-zinc-800 p-4 rounded-lg flex items-center justify-between hover:border-zinc-600 hover:bg-zinc-900/50 transition-all cursor-pointer group"
    >
      {content}
      <div className="text-xs text-zinc-600 font-mono group-hover:text-zinc-500 transition-colors">
        {timeString}
      </div>
    </div>
  );
};

export { ActivityItem };
export default ActivityItem;
