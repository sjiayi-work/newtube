'use client';

import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { trpc } from '@/trpc/client';
import { FilterCarousel } from '@/components/filter-carousel';

/**
 * NT-8: CategoriesSection component.
 */

interface CategoriesSectionProps {
    categoryId?: string;
}

export const CategoriesSection = ({ categoryId }: CategoriesSectionProps) => {
    return (
        <Suspense fallback={<FilterCarousel isLoading data={[]} onSelect={() => {}} />}>
            <ErrorBoundary fallback={<p>Error...</p>}>
                <CategoriesSectionSuspense categoryId={categoryId} />
            </ErrorBoundary>
        </Suspense>
    );
};

const CategoriesSectionSuspense = ({ categoryId }: CategoriesSectionProps) => {
    const router = useRouter();
    // access the cache
    const [categories] = trpc.categories.getMany.useSuspenseQuery();
    
    const data = categories.map((category) => ({
        value: category.id,
        label: category.name
    }));
    
    const onSelect = (value: string | null) => {
        const url = new URL(window.location.href);
        
        if (value) {
            // append to URL
            url.searchParams.set('categoryId', value);
        } else {
            url.searchParams.delete('categoryId');
        }
        
        // NOTE: using push is slower as it does not do prefetch
        router.push(url.toString());
    };
    
    return <FilterCarousel value={categoryId} data={data} onSelect={onSelect} />
};