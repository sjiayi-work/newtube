import { PropsWithChildren } from 'react';

import HomeLayout from '@/modules/home/ui/layouts/home-layout';

const Layout = ({ children }: PropsWithChildren) => {
    return (
        <div>
            <HomeLayout>
                { children }
            </HomeLayout>
        </div>
    )
}

export default Layout;