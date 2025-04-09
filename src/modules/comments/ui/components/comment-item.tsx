import Link from 'next/link';
import { useAuth, useClerk } from '@clerk/nextjs';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquareIcon, MoreVerticalIcon, ThumbsDownIcon, ThumbsUpIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/user-avatar';
import { cn } from '@/lib/utils';
import { trpc } from '@/trpc/client';
import { CommentsGetManyOutput } from '../../types';

/**
 * NT-22: A component that displays the user avatar and comment value.
 * 
 * @param {CommentItemProps} props - Component properties.
 * @param {CommentsGetManyOutput[number]} props.comment - Comment object.
 * 
 * @example
 * <CommentItem comment={comment} />
 */

interface CommentItemProps {
    comment: CommentsGetManyOutput['items'][number];
}

export const CommentItem = ({ comment }: CommentItemProps) => {
    const { userId } = useAuth();
    const clerk = useClerk();
    
    const utils = trpc.useUtils();
    const remove = trpc.comments.remove.useMutation({
        onSuccess: () => {
            toast.success('Comment deleted');
            utils.comments.getMany.invalidate({ videoId: comment.videoId });
        },
        onError: (error) => {
            toast.error('Something went wrong');
            
            if (error.data?.code === 'UNAUTHORIZED') {
                clerk.openSignIn();
            }
        }
    });
    
    // NT-24: Comment like
    const like = trpc.commentReactions.like.useMutation({
        onSuccess: () => {
            utils.comments.getMany.invalidate({ videoId: comment.videoId });
        },
        onError: (error) => {
            toast.error('Something went wrong');
            
            if (error.data?.code === 'UNAUTHORIZED') {
                clerk.openSignIn();
            }
        }
    });
    
    // NT-24: Comment dislike
    const dislike = trpc.commentReactions.dislike.useMutation({
        onSuccess: () => {
            utils.comments.getMany.invalidate({ videoId: comment.videoId });
        },
        onError: (error) => {
            toast.error('Something went wrong');
            
            if (error.data?.code === 'UNAUTHORIZED') {
                clerk.openSignIn();
            }
        }
    });
    
    return (
        <div>
            <div className="flex gap-4">
                <Link href={`/users/${comment.userId}`}>
                    <UserAvatar size="lg" imageUrl={comment.user.imageUrl} name={comment.user.name} />
                </Link>
                <div className="flex-1 min-w-0">
                    <Link href={`/users/${comment.userId}`}>
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-medium text-sm pb-0.5">
                                { comment.user.name }
                            </span>
                            <span className="text-xs text-muted-foreground">
                                { formatDistanceToNow(comment.createdAt, {
                                   addSuffix: true 
                                }) }
                            </span>
                        </div>
                    </Link>
                    
                    <p className="text-sm">{ comment.value }</p>
                    
                    {/* NT-24: Reactions */}
                    <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center">
                            <Button className="size-8" size="icon" variant="ghost" disabled={like.isPending} 
                                    onClick={() => like.mutate({ commentId: comment.id })}>
                                <ThumbsUpIcon className={cn(comment.viewerReaction === 'like' && 'fill-black')} />
                            </Button>
                            <span className="text-xs text-muted-foreground">{ comment.likeCount }</span>
                            
                            <Button className="size-8" size="icon" variant="ghost" disabled={dislike.isPending} 
                                    onClick={() => dislike.mutate({ commentId: comment.id })}>
                                <ThumbsDownIcon className={cn(comment.viewerReaction === 'dislike' && 'fill-black')} />
                            </Button>
                            <span className="text-xs text-muted-foreground">{ comment.dislikeCount }</span>
                        </div>
                    </div>
                </div>
                
                {/* NT-23: Implement delete comment */}
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger>
                        <Button variant="ghost" size="icon" className="size-8">
                            <MoreVerticalIcon />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {}}>
                            <MessageSquareIcon className="size-4" />
                            Reply
                        </DropdownMenuItem>
                        { comment.user.clerkId === userId && (
                            <DropdownMenuItem onClick={() => remove.mutate({ id: comment.id })}>
                                <Trash2Icon className="size-4" />
                                Delete
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};