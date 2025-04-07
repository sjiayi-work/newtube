import { PropsWithChildren } from 'react';

import StudioLayout from '@/modules/studio/ui/layouts/studio-layout';

const Layout = ({ children }: PropsWithChildren) => {
    return (
        <div>
            <StudioLayout>
                { children }
            </StudioLayout>
        </div>
    )
}

export default Layout;