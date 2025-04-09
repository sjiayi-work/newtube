import { useClerk, useUser } from '@clerk/nextjs';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/user-avatar';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { commentInsertSchema } from '@/db/schema';
import { trpc } from '@/trpc/client';

/**
 * NT-22: A component that displays a form to enter comment.
 * 
 * @param {CommentFormProps} props - Component properties.
 * @param {string} props.videoId - Video id.
 * @param {void} [props.onSuccess] - Function to execute after the form is submitted successfully.
 * 
 * @example
 * <CommentForm videoId={1} onSuccess={() => {}} />
 */

interface CommentFormProps {
    videoId: string;
    onSuccess?: () => void;
}

export const CommentForm = ({ videoId, onSuccess }: CommentFormProps) => {
    const { user } = useUser();
    const clerk = useClerk();
    
    const formSchema = commentInsertSchema.omit({ userId: true });
    
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            videoId,
            value: ''
        }
    });
    
    const utils = trpc.useUtils();
    const create = trpc.comments.create.useMutation({
        onSuccess: () => {
            utils.comments.getMany.invalidate({ videoId });
            form.reset();
            toast.success('Comment added');
            onSuccess?.();
        },
        onError: (error) => {
            toast.error('Something went wrong');
            
            if (error.data?.code === 'UNAUTHORIZED') {
                clerk.openSignIn();
            }
        }
    });
    
    const handleSubmit = (values: z.infer<typeof formSchema>) => {
        create.mutate(values);
    };
    
    return (
        <Form {...form}>
            <form className="flex gap-4 group" onSubmit={form.handleSubmit(handleSubmit)}>
                <UserAvatar size="lg" imageUrl={user?.imageUrl || '/user-placeholder.svg'} name={user?.username || 'User'} />
                <div className="flex-1">
                    <FormField name="value" control={form.control} render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Textarea className="resize-none bg-transparent overflow-hidden min-h-0" placeholder="Add a comment..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    
                    <div className="justify-end gap-2 mt-2 flex">
                        <Button type="submit" size="sm" disabled={create.isPending}>Comment</Button>
                    </div>
                </div>
            </form>
        </Form>
    );
};