import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  type?: string;
  url?: string;
  image?: string;
  keywords?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title = 'SPARKWavv | AI-Powered Career Branding & Identity',
  description = 'SPARKWavv is a next-gen AI career branding framework. Transform your professional history into a high-impact identity with Skylar, your AI career guide.',
  type = 'website',
  url = 'https://sparkwavv.ai',
  image = 'https://sparkwavv.ai/og-image.png',
  keywords = 'career branding, AI career guide, job search, professional identity, resume builder, career wellness',
}) => {
  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

      {/* Canonical URL */}
      <link rel="canonical" href={url} />
    </Helmet>
  );
};
