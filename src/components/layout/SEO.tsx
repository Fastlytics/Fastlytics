import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: string;
}

const DOMAIN = 'https://fastlytics.app';

export const SEO = ({
  title,
  description,
  keywords = [],
  image = '/og-image.png',
  url,
  type = 'website',
}: SEOProps) => {
  const siteTitle = 'Fastlytics';
  const fullTitle = title === siteTitle ? title : `${title} | ${siteTitle}`;
  const canonicalUrl = url ? url : DOMAIN;
  const absoluteImage = image.startsWith('http') ? image : `${DOMAIN}${image}`;

  const allKeywords = [
    'f1 analytics',
    'formula 1 data',
    'f1 telemetry',
    'f1 stats',
    'race strategy',
    'motorsport analytics',
    'f1 data visualization',
    'telemetry analysis',
    ...keywords,
  ].join(', ');

  return (
    <Helmet>
      {/* Standard metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={allKeywords} />
      <meta name="author" content="Subhash Gottumulla" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:site_name" content="Fastlytics" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@fastlytics" />
      <meta name="twitter:creator" content="@fastlytics" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteImage} />

      {/* Canonical */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Structured Data (JSON-LD) for SoftwareApplication */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Fastlytics',
          applicationCategory: 'SportsApplication',
          operatingSystem: 'Web',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
          description: description,
          author: {
            '@type': 'Person',
            name: 'Subhash Gottumulla',
          },
          sameAs: ['https://x.com/fastlytics', 'https://instagram.com/fastlytics'],
        })}
      </script>
    </Helmet>
  );
};
