import React, { ReactNode } from 'react';
import Head from 'next/head';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export default function Layout({ children, title = "Pinoy Tambayan Hub" }: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      
      {/* We removed <Navbar /> and <Footer /> from here 
         because they are already in _app.tsx! 
      */}
      <div className="animate-in fade-in duration-500">
        {children}
      </div>
    </>
  );
}