import { HydrateClient, trpc } from '@/trpc/server';
import { VideoView } from '@/modules/studio/ui/views/video-view';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ videoId: string }>;
}

const VideoPage = async ({ params }: PageProps) => {
    const { videoId } = await params;
    
    void trpc.studios.getOne.prefetch({ id: videoId });
    void trpc.categories.getMany.prefetch();
    
    return (
        <HydrateClient>
            <VideoView videoId={videoId} />
        </HydrateClient>
    );
};

export default VideoPage;