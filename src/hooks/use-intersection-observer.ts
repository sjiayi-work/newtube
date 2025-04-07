import { useEffect, useRef, useState } from 'react';

// NT-11: Detect if the bottom list is reached
export const useIntersectionObserver = (options?: IntersectionObserverInit) => {
    const [isIntersecting, setIsIntersecting] = useState(false);
    const targetRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            setIsIntersecting(entry.isIntersecting);
        }, options);
        
        if (targetRef.current) {
            observer.observe(targetRef.current);
        }
        
        return () => observer.disconnect();
        
    }, [options]);
    
    return { isIntersecting, targetRef };
};