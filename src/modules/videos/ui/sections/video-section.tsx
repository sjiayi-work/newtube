'use client';

import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useAuth } from '@clerk/nextjs';

import { cn } from '@/lib/utils';
import { VideoPlayer, VideoPlayerSkeleton } from '@/modules/videos/ui/components/video-player';
import { trpc } from '@/trpc/client';
import { VideoBanner } from '../components/video-banner';
import { VideoTopRow, VideoTopRowSkeleton } from '../components/video-top-row';

/**
 * NT-18: VideoSection component.
 */

interface VideoSectionProps {
    videoId: string;
}

export const VideoSection = ({ videoId }: VideoSectionProps) => {
    return (
        <Suspense fallback={<VideoSectionSkeleton />}>
            <ErrorBoundary fallback={<p>Error...</p>}>
                <VideoSectionSuspense videoId={videoId} />
            </ErrorBoundary>
        </Suspense>
    );
};

// NT-22: Display skeleton
const VideoSectionSkeleton = () => {
    return (
        <>
            <VideoPlayerSkeleton />
            <VideoTopRowSkeleton />
        </>
    );
};

const VideoSectionSuspense = ({ videoId }: VideoSectionProps) => {
    const { isSignedIn } = useAuth();
    
    // NT-19: Create views
    const utils = trpc.useUtils();
    const [video] = trpc.videos.getOne.useSuspenseQuery({ id: videoId });
    const createView = trpc.videoViews.create.useMutation({
        onSuccess: () => {
            utils.videos.getOne.invalidate();
        }
    });
    
    const handlePlay = () => {
        if (!isSignedIn) {
            return;
        }
        
        createView.mutate({ videoId });
    };
    
    return (
        <>
            <div className={cn('aspect-video bg-black rounded-xl overflow-hidden relative', video.muxStatus !== 'ready' && 'rounded-b-none')}>
                <VideoPlayer autoPlay onPlay={handlePlay} playbackId={video.muxPlaybackId} thumbnailUrl={video.thumbnailUrl} />
            </div>
            
            <VideoBanner status={video.muxStatus} />
            <VideoTopRow video={video} />
        </>
    );
};