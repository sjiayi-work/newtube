'use client';

import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { cn } from '@/lib/utils';
import { VideoPlayer } from '@/modules/videos/ui/components/video-player';
import { trpc } from '@/trpc/client';
import { VideoBanner } from '../components/video-banner';
import { VideoTopRow } from '../components/video-top-row';

/**
 * NT-18: VideoSection component.
 */

interface VideoSectionProps {
    videoId: string;
}

export const VideoSection = ({ videoId }: VideoSectionProps) => {
    return (
        <Suspense fallback={<p>Loading...</p>}>
            <ErrorBoundary fallback={<p>Error...</p>}>
                <VideoSectionSuspense videoId={videoId} />
            </ErrorBoundary>
        </Suspense>
    );
};

const VideoSectionSuspense = ({ videoId }: VideoSectionProps) => {
    const [video] = trpc.videos.getOne.useSuspenseQuery({ id: videoId });
    
    return (
        <>
            <div className={cn('aspect-video bg-black rounded-xl overflow-hidden relative', 'waiting' !== 'ready' && 'rounded-b-none')}>
                <VideoPlayer autoPlay onPlay={() => {}} playbackId={video.muxPlaybackId} thumbnailUrl={video.thumbnailUrl} />
            </div>
            
            <VideoBanner status='waiting' />
            <VideoTopRow video={video} />
        </>
    );
};