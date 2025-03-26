import { DEFAULT_LIMIT } from '@/constants';
import { StudioView } from '@/modules/studio/ui/views/studio-view';
import { HydrateClient, trpc } from '@/trpc/server';

const StudioPage = async () => {
    void trpc.studios.getMany.prefetchInfinite({ limit: DEFAULT_LIMIT });
    
    return (
        <HydrateClient>
            <StudioView />
        </HydrateClient>
    )
};

export default StudioPage;