import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Gauge } from "lucide-react"
import React from "react"
import { toPng } from "html-to-image"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
/**
 * Exports a DOM element (chart) as a PNG image with Fastlytics branding
 * @param elementRef - React ref to the DOM element to export
 * @param filename - Name for the downloaded file (without extension)
 */
export async function exportChartAsImage(
  elementRef: React.RefObject<HTMLElement>,
  filename: string = "fastlytics-chart"
): Promise<void> {
  if (!elementRef.current) {
    console.error("No element ref provided for chart export");
    return;
  }

  try {
    // Create a clone of the element to avoid modifying the original
    const originalElement = elementRef.current;
    
    // Wait a moment to ensure chart is fully rendered
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Use the original element with all SVG intact rather than cloning
    // Add some custom styles just for the export
    const originalStyles = {
      position: originalElement.style.position,
      background: originalElement.style.background,
      padding: originalElement.style.padding, // Store original padding
      borderRadius: originalElement.style.borderRadius,
      overflow: originalElement.style.overflow
    };
    
    // Add export styles
    originalElement.style.background = '#111827';
    originalElement.style.borderRadius = '8px';
    originalElement.style.overflow = 'visible';
    
    // Reduce padding AND remove bottom padding specifically for height calculation
    originalElement.style.padding = '8px 8px 0px 8px'; // Top, Right, Bottom=0, Left
    
    // Fix title display for export
    const cardHeader = originalElement.querySelector('div[class*="CardHeader"]');
    const chartTitle = originalElement.querySelector('h3[class*="CardTitle"]');
    
    if (chartTitle && cardHeader) {
      // Clone the title to ensure it doesn't get affected by layout issues
      const titleText = chartTitle.textContent || '';
      
      if (titleText) {
        // Create a dedicated title element for the export
        const exportTitle = document.createElement('div');
        exportTitle.style.fontWeight = 'bold';
        exportTitle.style.fontSize = '18px';
        exportTitle.style.color = 'white';
        exportTitle.style.marginBottom = '5px'; // Minimal margin
        exportTitle.style.textAlign = 'center';
        exportTitle.style.width = '100%';
        exportTitle.style.paddingTop = '8px';
        exportTitle.textContent = titleText;
        
        // Hide the original header
        (cardHeader as HTMLElement).style.display = 'none';
        
        // Insert the new title at the top
        if (originalElement.firstChild) {
          originalElement.insertBefore(exportTitle, originalElement.firstChild);
        } else {
          originalElement.appendChild(exportTitle);
        }
      }
    }
    
    // Find the chart container and reduce top margin
    const chartContainer = originalElement.querySelector('.recharts-responsive-container');
    if (chartContainer) {
      (chartContainer as HTMLElement).style.marginTop = '0px'; // No additional margin
    }
    
    // Find any title element and ensure it doesn't overlap
    const title = originalElement.querySelector('.text-lg.font-semibold');
    if (title) {
      (title as HTMLElement).style.marginBottom = '5px'; // Minimal margin
      (title as HTMLElement).style.whiteSpace = 'nowrap';
    }
    
    // Find button container, calculate its height, and hide it
    const buttonsContainer = originalElement.querySelector('.mt-4.flex.justify-end'); // Use the class from SpeedTraceChart.tsx
    let buttonsContainerHeight = 0;
    let originalButtonContainerDisplay = '';
    if (buttonsContainer) {
      buttonsContainerHeight = (buttonsContainer as HTMLElement).offsetHeight + 16; // Get height + margin-top (mt-4 -> 1rem -> 16px)
      originalButtonContainerDisplay = (buttonsContainer as HTMLElement).style.display;
      (buttonsContainer as HTMLElement).style.display = 'none'; // Hide the container
    }
    
    // Create and add branding container (keeping previous styling)
    const brandingDiv = document.createElement('div');
    brandingDiv.style.position = 'absolute';
    brandingDiv.style.bottom = '10px'; // Position near bottom
    brandingDiv.style.right = '15px';
    brandingDiv.style.display = 'flex';
    brandingDiv.style.alignItems = 'center';
    brandingDiv.style.gap = '5px';
    brandingDiv.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    brandingDiv.style.fontSize = '14px';
    brandingDiv.style.letterSpacing = '-0.02em';
    brandingDiv.style.color = 'white';
    brandingDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.65)';
    brandingDiv.style.padding = '4px 8px';
    brandingDiv.style.borderRadius = '4px';
    brandingDiv.style.zIndex = '9999';
    
    const gaugeIcon = document.createElement('span');
    gaugeIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-gauge" style="color: #ef4444;"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>`;
    const fastlyticsText = document.createElement('span');
    fastlyticsText.innerHTML = '<span style="color: white; font-weight: 600; letter-spacing: -0.02em;">Fast</span><span style="color: #ef4444; font-weight: 600; letter-spacing: -0.02em;">lytics</span>';
    brandingDiv.appendChild(gaugeIcon);
    brandingDiv.appendChild(fastlyticsText);
    originalElement.appendChild(brandingDiv);

    // Calculate the height required, excluding hidden button container AND bottom padding
    // Add a small buffer (e.g., 5px) to ensure the bottom logo isn't cut off
    const calculatedHeight = originalElement.scrollHeight - buttonsContainerHeight + 5;
    
    // Convert to image, setting quality and resolution
    const dataUrl = await toPng(originalElement, {
      quality: 0.98,
      pixelRatio: 2,
      backgroundColor: '#111827',
      cacheBust: true,
      skipFonts: true,
      fontEmbedCSS: '',
      filter: (node) => {
        // Explicitly exclude the button container if somehow still visible
        if (buttonsContainer && node instanceof HTMLElement && node.isSameNode(buttonsContainer)) {
          return false;
        }
        return true; // Include all other nodes
      },
      width: originalElement.offsetWidth,
      height: calculatedHeight, // Use calculated height
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left'
      },
      canvasWidth: originalElement.offsetWidth,
      canvasHeight: calculatedHeight // Use calculated height
    });
    
    // Clean up - restore original styles (including original padding)
    originalElement.style.position = originalStyles.position;
    originalElement.style.background = originalStyles.background;
    originalElement.style.padding = originalStyles.padding; // Restore original padding
    originalElement.style.borderRadius = originalStyles.borderRadius;
    originalElement.style.overflow = originalStyles.overflow;
    
    // Restore button container visibility
    if (buttonsContainer) {
       (buttonsContainer as HTMLElement).style.display = originalButtonContainerDisplay; // Restore original display
    }
    
    // Remove branding
    if (originalElement.contains(brandingDiv)) {
      originalElement.removeChild(brandingDiv);
    }
    
    // Create download link
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = dataUrl;
    link.click();
    
  } catch (error) {
    console.error('Error exporting chart as image:', error);
    
    // Show user-visible error alert
    if (typeof window !== 'undefined') {
      alert('Failed to export chart. Please try again later.');
    }
  }
}

// --- Tire Compound Colors ---

export const CompoundColors: Record<string, string> = {
    SOFT: '#EF4444', // Red
    MEDIUM: '#FCD34D', // Yellow
    HARD: '#FFFFFF', // White
    INTERMEDIATE: '#22C55E', // Green
    WET: '#3B82F6', // Blue
    UNKNOWN: '#9CA3AF', // Gray
    TEST: '#A78BFA', // Purple (for test compounds if ever needed)
  };
  
  export const getCompoundColor = (compound: string | undefined | null): string => {
    if (!compound) return CompoundColors.UNKNOWN;
    const upperCompound = compound.toUpperCase();
    return CompoundColors[upperCompound] || CompoundColors.UNKNOWN;
  };

// Function to format time in seconds to MM:SS.ms
export function formatTime(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) {
    return "--:--.---"; // Return placeholder for invalid input
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.round((totalSeconds - Math.floor(totalSeconds)) * 1000);

  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');
  const formattedMilliseconds = String(milliseconds).padStart(3, '0');

  return `${formattedMinutes}:${formattedSeconds}.${formattedMilliseconds}`;
}

// Add other utility functions if needed

