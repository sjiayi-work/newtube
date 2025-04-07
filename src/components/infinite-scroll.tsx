import { useEffect } from 'react';

import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { Button } from './ui/button';

interface InfiniteScrollProps {
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => void;
    isManual?: boolean;
}

export const InfiniteScroll = ({ hasNextPage, isFetchingNextPage, fetchNextPage, isManual = false }: InfiniteScrollProps) => {
    const { targetRef, isIntersecting } = useIntersectionObserver({
        threshold: 0.5,
        rootMargin: '100px'
    });
    
    useEffect(() => {
        if (isIntersecting && hasNextPage && !isFetchingNextPage && !isManual) {
            fetchNextPage();
        }
    }, [isIntersecting, isFetchingNextPage, hasNextPage, isManual, fetchNextPage]);
    
    return (
        <div className="flex flex-col items-center gap-4 p-4">
            <div className="h-1" ref={targetRef}></div>
            { hasNextPage ? ( 
                <Button variant="secondary" disabled={!hasNextPage || isFetchingNextPage}
                        onClick={() => fetchNextPage()}>
                    { isFetchingNextPage ? 'Loading...' : 'Load more'  }
                </Button> 
            ) : <p className="text-xs text-muted-foreground">You have reached the end of the list</p>}
        </div>
    );
};