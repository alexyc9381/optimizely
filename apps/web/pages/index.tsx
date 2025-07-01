import Head from 'next/head';
import UniversalAIDashboard from '../components/UniversalAIDashboard';

export default function Home() {
  return (
    <>
      <Head>
        <title>Universal AI Platform - Multi-Industry A/B Testing & Analytics</title>
        <meta name="description" content="AI-powered A/B testing and analytics platform supporting SaaS, Manufacturing, Healthcare, FinTech, and College Consulting industries." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />

        {/* Optimized fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>

      <UniversalAIDashboard />
    </>
  );
}
