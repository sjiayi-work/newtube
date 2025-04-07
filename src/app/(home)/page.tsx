import { HydrateClient, trpc } from '@/trpc/server';
import { HomeView } from '@/modules/home/ui/views/home-view';

export const dynamic = 'force-dynamic';     // <-- must have when have prefetch

interface HomeProps {
    searchParams: Promise<{ categoryId?: string; }>
}

export default async function Home({ searchParams }: HomeProps) {
    const { categoryId } = await searchParams;
    
    /**
     * Method 1: Client side calling, need to import trpc client     
     *      const { data } = trpc.hello.useQuery({ text: 'John' });
     * 
     * Method 2: Server side calling
     *      const data = await trpc.hello({ text: 'King' });
     * 
     * Method 3: Prefetch from server, like current code
     */
    void trpc.categories.getMany.prefetch();
    
    return (
        <HydrateClient>
            <HomeView categoryId={categoryId} />
        </HydrateClient>
    );
}