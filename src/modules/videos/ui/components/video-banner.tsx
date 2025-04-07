import { AlertTriangleIcon } from 'lucide-react';

import { VideoGetOneOutput } from '../../types';

/**
 * NT-18: VideoBanner component.
 */

interface VideoBannerProps {
    status: VideoGetOneOutput['muxStatus'];
}

export const VideoBanner = ({ status }: VideoBannerProps) => {
    if (status === 'ready') {
        return;
    }
    
    return (
        <div className="bg-yellow-500 py-3 px-4 rounded-b-xl flex items-center gap-2">
            <AlertTriangleIcon className="size-4 text-black shrink-0" />
            <p className="text-xs md:text-sm font-medium text-black line-clamp-1">
                This video is still being processed.
            </p>
        </div>
    );
};