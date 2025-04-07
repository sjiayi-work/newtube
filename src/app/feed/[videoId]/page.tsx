interface PageProps {
    params: Promise<{ videoId: string }>
}

const VideoPage = async ({ params }: PageProps) => {
    console.log('Server Component');
    const { videoId } = await params;
    
    return (
        <div>Video Id Page: { videoId }</div>
    );
};

export default VideoPage;