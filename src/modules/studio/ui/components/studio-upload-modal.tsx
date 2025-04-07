'use client';

import { useRouter } from 'next/navigation';
import { Loader2Icon, PlusIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ResponsiveModal } from '@/components/responsive-modal';
import { trpc } from '@/trpc/client';
import { StudioUploader } from './studio-uploader';

export const StudioUploadModal = () => {
    const router = useRouter();
    const utils = trpc.useUtils();
    
    // NT-10: Create video
    const create = trpc.videos.create.useMutation({
        onSuccess: () => {
            toast.success('Video created');
            // refresh the video list
            utils.studios.getMany.invalidate();
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });
    
    const onSuccess = () => {
        if (!create.data?.video.id) {
            return;
        }
        
        create.reset();
        router.push(`/studio/videos/${create.data.video.id}`);
    };
    
    return (
        <>
            <ResponsiveModal title="Upload a video" open={!!create.data} onOpenChange={() => create.reset()}>
                { create.data?.url ? <StudioUploader endpoint={create.data?.url} onSuccess={onSuccess} /> : <Loader2Icon /> }
            </ResponsiveModal>
            <Button variant="secondary" onClick={() => create.mutate()} disabled={create.isPending}>
                { create.isPending ? <Loader2Icon className="animate-spin" /> : <PlusIcon /> }
                Create
            </Button>
        </>
    );
};