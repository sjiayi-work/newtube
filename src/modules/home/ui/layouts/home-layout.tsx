import { SidebarProvider } from '@/components/ui/sidebar';
import { PropsWithChildren } from 'react'
import { HomeNavbar } from '../components/home-navbar';
import { HomeSidebar } from '../components/home-sidebar';

const HomeLayout = ({ children }: PropsWithChildren) => {
    return (
        <SidebarProvider>
            <div className="w-full">
                <HomeNavbar />
                <div className="flex min-h-screen pt-[4rem]">
                    <HomeSidebar />
                    <main className="flex-1 overflow-y-auto">{ children }</main>
                </div>
            </div>
        </SidebarProvider>
    );
}

export default HomeLayout;