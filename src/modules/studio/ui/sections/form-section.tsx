'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useForm } from 'react-hook-form';
import { zodResolver} from '@hookform/resolvers/zod';
import z from 'zod';
import { CopyCheckIcon, CopyIcon, Globe2Icon, ImagePlusIcon, LockIcon, MoreVerticalIcon, RotateCcwIcon, SparklesIcon, TrashIcon } from 'lucide-react';
import { toast } from 'sonner';

import { trpc } from '@/trpc/client';
import { videoUpdateSchema } from '@/db/schema';
import { snakeCaseToTitle } from '@/lib/utils';
import { THUMBNAIL_FALLBACK } from '@/constants';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VideoPlayer } from '../components/video-player';
import { ThumbnailUploadModal } from '../components/thumbnail-upload-modal';

interface FormSectionProps {
    videoId: string;
}

export const FormSection = ({ videoId }: FormSectionProps) => {
    return (
        <Suspense fallback={<FormSectionSkeleton />}>
            <ErrorBoundary fallback={<p>Error...</p>}>
                <FormSectionSuspence videoId={videoId} />
            </ErrorBoundary>
        </Suspense>
    );
};

const FormSectionSkeleton = () => {
    return (
        <p>Loading...</p>
    );
};

const FormSectionSuspence = ({ videoId }: FormSectionProps) => {
    const router = useRouter();
    const utils = trpc.useUtils();
    
    const [thumbnailModalOpen, setThumbnailModalOpen] = useState(false);
    
    const [video] = trpc.studios.getOne.useSuspenseQuery({ id: videoId });
    const [categories] = trpc.categories.getMany.useSuspenseQuery();
    
    const update = trpc.videos.update.useMutation({
        onSuccess: () => {
            utils.studios.getMany.invalidate();
            utils.studios.getOne.invalidate({ id: videoId });
            toast.success('Video updated');
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });
    
    const remove = trpc.videos.remove.useMutation({
        onSuccess: () => {
            utils.studios.getMany.invalidate();
            toast.success('Video deleted');
            router.push('/studio');
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });
    
    const restoreThumbnail = trpc.videos.restoreThumbnail.useMutation({
        onSuccess: () => {
            utils.studios.getMany.invalidate();
            utils.studios.getOne.invalidate({ id: videoId });
            toast.success('Thumbnail updated');
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });
    
    const form = useForm<z.infer<typeof videoUpdateSchema>>({
        resolver: zodResolver(videoUpdateSchema),
        defaultValues: video
    });
    
    const onSubmit = async (data: z.infer<typeof videoUpdateSchema>) => {
        update.mutate(data);
    };
    
    // TODO: Change if deploying outside of Vercel
    const fullUrl = `${process.env.VERCEL_URL || 'http://localhost:3000'}/videos/${video.id}`;
    const [isCopied, setIsCopied] = useState(false);
    
    const onCopy = async () => {
        await navigator.clipboard.writeText(fullUrl);
        setIsCopied(true);
        
        setTimeout(() => {
            setIsCopied(false);
        }, 2000);
    };
    
    return (
        <>
            <ThumbnailUploadModal open={thumbnailModalOpen} onOpenChange={setThumbnailModalOpen} videoId={videoId} />
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold">Video details</h1>
                            <p className="text-sm text-muted-foreground">Manage your video details</p>
                        </div>
                        <div className="flex items-center gap-x-2">
                            <Button type="submit" disabled={update.isPending}>Save</Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreVerticalIcon />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => remove.mutate({ id: video.id })}>
                                        <TrashIcon className="size-4 mr-2" />
                                        <span>Delete</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        <div className="space-y-8 lg:col-span-3">
                            <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Add a title to your video" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            
                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} value={field.value ?? ''} rows={10} className="resize-none pr-10"
                                                    placeholder="Add a description to your video" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            
                            {/* Add thumbnail field */}
                            <FormField name="thumbnailUrl" control={form.control} render={() => (
                                <FormItem>
                                    <FormLabel>Thumbnail</FormLabel>
                                    <FormControl>
                                        <div className="p-0.5 border border-dashed border-neutral-400 relative h-[84px] w-[153px] group">
                                            <Image src={video.thumbnailUrl || THUMBNAIL_FALLBACK} 
                                                    className="object-cover" fill alt="Thumbnail" />
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button type="button" size="icon" 
                                                            className="bg-black/50 hover:bg-black/50 absolute top-1 right-1 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 duration-300 size-7">
                                                        <MoreVerticalIcon className="text-white" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" side="right">
                                                    <DropdownMenuItem onClick={() => setThumbnailModalOpen(true)}>
                                                        <ImagePlusIcon className="size-4 mr-1" />
                                                        Change
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <SparklesIcon className="size-4 mr-1" />
                                                        AI-generated
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => restoreThumbnail.mutate({ id: videoId })}>
                                                        <RotateCcwIcon className="size-4 mr-1" />
                                                        Restore
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </FormControl>
                                </FormItem>
                            )} />
                            
                            <FormField control={form.control} name="categoryId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                                        <FormControl>
                                            <SelectTrigger className="w-auto">
                                                <SelectValue placeholder="Select a category" />
                                            </SelectTrigger>
                                        </FormControl>
                                        
                                        <SelectContent>
                                            { categories.map((category) => (
                                                <SelectItem key={category.id} value={category.id}>
                                                    { category.name }
                                                </SelectItem>
                                            )) }
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        
                        <div className="flex flex-col gap-y-8 lg:col-span-2">
                            <div className="flex flex-col gap-4 bg-[#f9f9f9] rounded-xl overflow-hidden h-fit">
                                <div className="aspect-video overflow-hidden relative">
                                    <VideoPlayer playbackId={video.muxPlaybackId} thumbnailUrl={video.thumbnailUrl} />
                                </div>
                                
                                <div className="p-4 flex flex-col gap-y-6">
                                    <div className="flex justify-between items-center gap-x-2">
                                        <div className="flex flex-col gap-y-1">
                                            <p className="text-muted-foreground text-xs">
                                                Video link
                                            </p>
                                            <div className="flex items-center gap-x-2">
                                                <Link href={`/videos/${video.id}`}>
                                                    <p className="line-clamp-1 text-sm text-blue-500">{ fullUrl }</p>
                                                </Link>
                                                <Button type="button" variant="ghost" size="icon" 
                                                        className="shrink-0 cursor-pointer"
                                                        onClick={onCopy} disabled={isCopied}>
                                                    { isCopied ? <CopyCheckIcon/> : <CopyIcon />}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col gap-y-1">
                                            <p className="text-xs text-muted-foreground">Video status</p>
                                            <p className="text-sm">
                                                { snakeCaseToTitle(video.muxStatus || 'preparing') }
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col gap-y-1">
                                            <p className="text-xs text-muted-foreground">Subtitles status</p>
                                            <p className="text-sm">
                                                { snakeCaseToTitle(video.muxTrackStatus || 'no_subtitles') }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <FormField control={form.control} name="visibility" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Visibility</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                                        <FormControl>
                                            <SelectTrigger className="w-auto">
                                                <SelectValue placeholder="Select visibility" />
                                            </SelectTrigger>
                                        </FormControl>
                                        
                                        <SelectContent>
                                            <SelectItem value='public'>
                                                <Globe2Icon className="size-4 mr-2" />
                                                Public
                                            </SelectItem>
                                            <SelectItem value='private'>
                                                <LockIcon className="size-4 mr-2" />
                                                Private
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                    </div>
                </form>
            </Form>
        </>
    );
};