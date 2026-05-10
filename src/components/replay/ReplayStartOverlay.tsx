import { Play } from 'lucide-react';

interface ReplayStartOverlayProps {
  onStart: () => void;
}

const ReplayStartOverlay = ({ onStart }: ReplayStartOverlayProps) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm transition-all duration-500">
      <button
        onClick={onStart}
        className="group relative flex items-center justify-center size-24 bg-red-600 hover:bg-red-500 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95"
      >
        <Play size={48} className="text-white fill-white ml-2" />
        <div className="absolute inset-0 rounded-full ring-4 ring-white/20 group-hover:ring-white/40 animate-pulse" />
      </button>
      <div className="absolute bottom-20 text-center">
        <p className="text-white font-bold text-lg tracking-widest uppercase drop-shadow-md">
          Start Replay
        </p>
      </div>
    </div>
  );
};

export { ReplayStartOverlay };
export default ReplayStartOverlay;
