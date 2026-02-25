import React, { ReactNode } from 'react';
import Head from 'next/head';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  image?: string;
}

export default function Layout({ 
  children, 
  title = "Pinoy Tambayan Hub",
  description = "The ultimate community for Filipinos worldwide. Join the discussion, listen to live radio, and connect.",
  image = "/og-image.jpg" // Make sure to put a cool banner in your public folder
}: LayoutProps) {
  
  const siteTitle = title.includes("Pinoy Tambayan") ? title : `${title} | Pinoy Tambayan Hub`;

  return (
    <>
      <Head>
        {/* Basic SEO */}
        <title>{siteTitle}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        
        {/* OpenGraph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={siteTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={image} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={siteTitle} />
        <meta name="twitter:description" content={description} />
        
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      {/* Accessibility: Skip to Content */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-[9999] bg-blue-600 text-white px-4 py-2 rounded-xl font-bold"
      >
        Skip to content
      </a>

      {/* Main Page Wrapper */}
      <main 
        id="main-content"
        className="min-h-screen flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-700 ease-out"
      >
        {/* Container logic: 
          We use a standard max-width here so all pages 
          feel consistent in their horizontal alignment.
        */}
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
          {children}
        </div>
      </main>

      {/* The Navbar/Footer are in _app.tsx, 
        so they surround this component.
      */}
    </>
  );
}