import Image from 'next/image';

import { formatDuration } from '@/lib/utils';
import { THUMBNAIL_FALLBACK } from '@/constants';

interface VideoThumbnailProps {
    title: string;
    duration: number;
    imageUrl?: string | null;
    previewUrl?: string | null;
}

export const VideoThumbnail = ({ title, imageUrl, previewUrl, duration }: VideoThumbnailProps) => {
    return (
        <div className="relative group">
            {/* Thumbnail wrapper */}
            <div className="relative w-full overflow-hidden rounded-xl aspect-video">
                <Image className="h-full w-full object-cover group-hover:opacity-0" 
                        src={ imageUrl || THUMBNAIL_FALLBACK} alt={title} fill />
                <Image className="h-full w-full object-cover opacity-0 group-hover:opacity-100" 
                        src={ previewUrl || THUMBNAIL_FALLBACK} alt={title} fill unoptimized={!!previewUrl} />
            </div>
            
            {/* Video duration box */}
            <div className="absolute bottom-2 right-2 px-1 py-0.5 round bg-black/80 text-white text-xs font-medium">
                { formatDuration(duration) }
            </div>
        </div>
    );
};