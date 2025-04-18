import { useClerk } from '@clerk/nextjs';
import { ThumbsDownIcon, ThumbsUpIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { trpc } from '@/trpc/client';
import { VideoGetOneOutput } from '../../types';

/**
 * NT-18: VideoReactions component.
 */

interface VideoReactionsProps {
    videoId: string;
    likes: number;
    dislikes: number;
    viewerReaction: VideoGetOneOutput['viewerReactions'];
}

export const VideoReactions = ({ videoId, likes, dislikes, viewerReaction }: VideoReactionsProps) => {
    const clerk = useClerk();
    const utils = trpc.useUtils();
    
    const like = trpc.videoReactions.like.useMutation({
        onSuccess: () => {
            utils.videos.getOne.invalidate();
            // TODO: invalidate "liked" playlist
        },
        onError: (error) => {
            toast.error('Something went wrong');
            
            if (error.data?.code == 'UNAUTHORIZED') {
                clerk.openSignIn();
            }
        }
    });
    
    const dislike = trpc.videoReactions.dislike.useMutation({
        onSuccess: () => {
            utils.videos.getOne.invalidate();
            // TODO: invalidate "liked" playlist
        },
        onError: (error) => {
            toast.error('Something went wrong');
            
            if (error.data?.code == 'UNAUTHORIZED') {
                clerk.openSignIn();
            }
        }
    });
    
    return (
        <div className="flex items-center flex-none">
            <Button className="rounded-l-full rounded-r-none gap-2 pr-4" variant="secondary" 
                    onClick={() => like.mutate({ videoId })} disabled={like.isPending || dislike.isPending}>
                <ThumbsUpIcon className={cn('size-5', viewerReaction === 'like' && 'fill-black')} />
                {likes}
            </Button>
            
            <Separator orientation="vertical" className="h-7" />
            
            <Button className="rounded-l-none rounded-r-full pl-3" variant="secondary"
                    onClick={() => dislike.mutate({ videoId })} disabled={like.isPending || dislike.isPending}>
                <ThumbsDownIcon className={cn('size-5', viewerReaction === 'dislike' && 'fill-black')} />
                {dislikes}
            </Button>
        </div>
    );
};