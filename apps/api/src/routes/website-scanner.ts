import express from 'express';
import FirecrawlApp from '@mendable/firecrawl-js';

const router = express.Router();

interface ScrapedElement {
  type: string;
  text: string;
  location: string;
  attributes?: Record<string, string>;
}

interface ScanResult {
  url: string;
  title: string;
  description: string;
  industry: string;
  elements: {
    buttons: Array<{
      text: string;
      location: string;
      type: 'cta' | 'navigation' | 'form';
      prominence: number;
    }>;
    headlines: Array<{
      text: string;
      level: number;
      location: string;
    }>;
    images: Array<{
      alt: string;
      src: string;
      location: string;
    }>;
    forms: Array<{
      type: string;
      fields: string[];
      location: string;
    }>;
  };
  metrics: {
    loadTime: number;
    mobileOptimized: boolean;
    conversionElements: number;
    trustSignals: number;
  };
  recommendations: string[];
}

// POST /api/v1/website/scan
router.post('/scan', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format'
      });
    }

    const startTime = Date.now();

        try {
      const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
      
      if (!firecrawlApiKey) {
        throw new Error('FIRECRAWL_API_KEY environment variable is not set');
      }

      // Initialize Firecrawl app
      console.log(`Starting Firecrawl scan for URL: ${url}`);
      console.log(`Using Firecrawl API key: ${firecrawlApiKey ? firecrawlApiKey.substring(0, 10) + '...' : 'MISSING'}`);
      
      const app = new FirecrawlApp({ apiKey: firecrawlApiKey });

      // Scrape the page with Firecrawl
      const crawlResult = await app.scrapeUrl(url, {
        formats: ['markdown', 'html']
      });

      if (!crawlResult || !crawlResult.success) {
        throw new Error('Firecrawl failed to extract data from the page');
      }

      const loadTime = Date.now() - startTime;
      const data = (crawlResult as any).data;

      console.log('Firecrawl scan completed successfully');
      console.log('Available data keys:', data ? Object.keys(data) : 'No data');

      // Extract basic page information
      const title = data.extract?.title || data.metadata?.title || 'Untitled Page';
      const description = data.extract?.description || data.metadata?.description || '';
      
      // Extract structured data or parse from markdown/html
      let headlines = data.extract?.headlines || [];
      let buttons = data.extract?.buttons || [];
      let images = data.extract?.images || [];
      let forms = data.extract?.forms || [];

      // If extraction didn't work, parse from markdown or HTML
      if (headlines.length === 0 || buttons.length === 0) {
        const content = data.markdown || data.html || '';
        
        // Extract headlines from markdown/HTML
        if (headlines.length === 0) {
          const headlineMatches = content.match(/^#{1,6}\s+(.+)$/gm) || [];
          headlines = headlineMatches.map((match: string, index: number) => {
            const level = (match.match(/^#+/) || [''])[0].length;
            const text = match.replace(/^#+\s+/, '').trim();
            return {
              text: text.substring(0, 200),
              level,
              location: `H${level} ${index + 1}`
            };
          });
        }

        // Extract buttons from content
        if (buttons.length === 0) {
          const buttonMatches = content.match(/\[([^\]]+)\]\([^)]+\)|<button[^>]*>([^<]*)<\/button>|<input[^>]*type=["'](?:button|submit)["'][^>]*>/gi) || [];
          buttons = buttonMatches.map((match: string, index: number) => {
            let text = '';
            if (match.startsWith('[')) {
              text = match.match(/\[([^\]]+)\]/)?.[1] || '';
            } else {
              text = match.match(/>([^<]*)</)?.[1] || `Button ${index + 1}`;
            }
            
            let type: 'cta' | 'navigation' | 'form' = 'navigation';
            const btnText = text.toLowerCase();
            if (btnText.includes('buy') || btnText.includes('purchase') || btnText.includes('get started') || btnText.includes('sign up')) {
              type = 'cta';
            } else if (btnText.includes('submit') || btnText.includes('send')) {
              type = 'form';
            }

            return {
              text: text.substring(0, 100),
              location: `Button ${index + 1}`,
              type,
              prominence: 5
            };
          });
        }

        // Extract images if not already extracted
        if (images.length === 0) {
          const imageMatches = content.match(/!\[([^\]]*)\]\(([^)]+)\)|<img[^>]*>/gi) || [];
          images = imageMatches.map((match: string, index: number) => {
            let alt = '', src = '';
            if (match.startsWith('!')) {
              const mdMatch = match.match(/!\[([^\]]*)\]\(([^)]+)\)/);
              alt = mdMatch?.[1] || '';
              src = mdMatch?.[2] || '';
            } else {
              alt = match.match(/alt=["']([^"']*)["']/i)?.[1] || '';
              src = match.match(/src=["']([^"']*)["']/i)?.[1] || '';
            }
            return {
              alt: alt.substring(0, 100),
              src: src.substring(0, 200),
              location: `Image ${index + 1}`
            };
          }).filter((img: any) => img.src);
        }
      }

      // Check mobile optimization from HTML
      const html = data.html || '';
      const mobileOptimized = html.includes('viewport') && html.includes('width=device-width');

      // Count trust signals in content
      const trustWords = ['secure', 'ssl', 'encrypted', 'verified', 'certified', 'guarantee', 'testimonial', 'review'];
      const allContent = (title + ' ' + description + ' ' + (data.markdown || '') + ' ' + html).toLowerCase();
      const trustSignals = trustWords.filter(word => allContent.includes(word)).length;

      // Generate industry guess
      const industry = guessIndustry(title, description, headlines);

      // Calculate metrics
      const conversionElements = buttons.filter((btn: any) => btn.type === 'cta').length + forms.length;

      // Generate recommendations
      const recommendations = generateRecommendations({ title, description, elements: { buttons, headlines, images, forms } }, conversionElements, trustSignals);

      const scanResult: ScanResult = {
        url,
        title,
        description,
        industry,
        elements: { buttons, headlines, images, forms },
        metrics: {
          loadTime,
          mobileOptimized,
          conversionElements,
          trustSignals
        },
        recommendations
      };

      res.json({
        success: true,
        data: scanResult
      });

    } catch (error) {
      console.error('Firecrawl crawler error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to crawl page with Firecrawl. Please check your API key and try again: ' + (error as Error).message
      });
    }

  } catch (error) {
    console.error('Website scan error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Helper functions to extract elements from Apify crawler data
function extractHeadlines(crawlData: any, html: string): any[] {
  // Try to get headlines from crawler data first
  if (crawlData.headings && Array.isArray(crawlData.headings)) {
    return crawlData.headings.map((heading: any, index: number) => ({
      text: heading.text ? heading.text.substring(0, 200) : '',
      level: heading.level || 1,
      location: `H${heading.level || 1} ${index + 1}`
    }));
  }

  // Fallback to HTML parsing
  const headlineMatches = html.match(/<h[1-6][^>]*>([^<]*)<\/h[1-6]>/gi) || [];
  return headlineMatches.map((match, index) => {
    const levelMatch = match.match(/<h([1-6])/i);
    const textMatch = match.match(/>([^<]*)</);
    return {
      text: textMatch ? textMatch[1].trim().substring(0, 200) : '',
      level: levelMatch ? parseInt(levelMatch[1]) : 1,
      location: `H${levelMatch ? levelMatch[1] : '1'} ${index + 1}`
    };
  }).filter(h => h.text);
}

function extractButtons(crawlData: any, html: string): any[] {
  // Try to get buttons from crawler data first
  if (crawlData.buttons && Array.isArray(crawlData.buttons)) {
    return crawlData.buttons.map((btn: any, index: number) => {
      const text = btn.text || btn.value || `Button ${index + 1}`;
      let type: 'cta' | 'navigation' | 'form' = 'navigation';
      const btnText = text.toLowerCase();

      if (btnText.includes('buy') || btnText.includes('purchase') || btnText.includes('get started') || btnText.includes('sign up')) {
        type = 'cta';
      } else if (btnText.includes('submit') || btnText.includes('send')) {
        type = 'form';
      }

      return {
        text: text.substring(0, 100),
        location: `Button ${index + 1}`,
        type,
        prominence: 5
      };
    });
  }

  // Fallback to HTML parsing
  const buttonMatches = html.match(/<button[^>]*>([^<]*)<\/button>|<input[^>]*type=["'](?:button|submit)["'][^>]*>/gi) || [];
  return buttonMatches.map((match, index) => {
    const textMatch = match.match(/>([^<]*)</);
    const valueMatch = match.match(/value=["']([^"']*)["']/i);
    const text = textMatch ? textMatch[1].trim() : (valueMatch ? valueMatch[1].trim() : `Button ${index + 1}`);

    let type: 'cta' | 'navigation' | 'form' = 'navigation';
    const btnText = text.toLowerCase();
    if (btnText.includes('buy') || btnText.includes('purchase') || btnText.includes('get started') || btnText.includes('sign up')) {
      type = 'cta';
    } else if (btnText.includes('submit') || btnText.includes('send')) {
      type = 'form';
    }

    return {
      text: text.substring(0, 100),
      location: `Button ${index + 1}`,
      type,
      prominence: 5
    };
  }).filter(btn => btn.text);
}

function extractImages(crawlData: any, html: string): any[] {
  // Try to get images from crawler data first
  if (crawlData.images && Array.isArray(crawlData.images)) {
    return crawlData.images.map((img: any, index: number) => ({
      alt: (img.alt || '').substring(0, 100),
      src: (img.src || img.url || '').substring(0, 200),
      location: `Image ${index + 1}`
    })).filter((img: any) => img.src);
  }

  // Fallback to HTML parsing
  const imageMatches = html.match(/<img[^>]*>/gi) || [];
  return imageMatches.map((match, index) => {
    const altMatch = match.match(/alt=["']([^"']*)["']/i);
    const srcMatch = match.match(/src=["']([^"']*)["']/i);
    return {
      alt: altMatch ? altMatch[1].substring(0, 100) : '',
      src: srcMatch ? srcMatch[1].substring(0, 200) : '',
      location: `Image ${index + 1}`
    };
  }).filter(img => img.src);
}

function extractForms(crawlData: any, html: string): any[] {
  // Try to get forms from crawler data first
  if (crawlData.forms && Array.isArray(crawlData.forms)) {
    return crawlData.forms.map((form: any, index: number) => ({
      type: form.action ? 'submission' : 'interactive',
      fields: form.fields || [],
      location: `Form ${index + 1}`
    }));
  }

  // Fallback to HTML parsing
  const formMatches = html.match(/<form[^>]*>[\s\S]*?<\/form>/gi) || [];
  return formMatches.map((match, index) => {
    const inputMatches = match.match(/<input[^>]*>/gi) || [];
    const textareaMatches = match.match(/<textarea[^>]*>/gi) || [];
    const selectMatches = match.match(/<select[^>]*>/gi) || [];

    const fields: string[] = [];

    [...inputMatches, ...textareaMatches, ...selectMatches].forEach(input => {
      const nameMatch = input.match(/name=["']([^"']*)["']/i);
      const placeholderMatch = input.match(/placeholder=["']([^"']*)["']/i);
      const typeMatch = input.match(/type=["']([^"']*)["']/i);

      const field = nameMatch ? nameMatch[1] : (placeholderMatch ? placeholderMatch[1] : (typeMatch ? typeMatch[1] : 'field'));
      if (field) fields.push(field);
    });

    return fields.length > 0 ? {
      type: match.includes('action=') ? 'submission' : 'interactive',
      fields,
      location: `Form ${index + 1}`
    } : null;
  }).filter(Boolean) as any[];
}

function guessIndustry(title: string, description: string, headlines: any[]): string {
  const content = (title + ' ' + description + ' ' + headlines.map(h => h.text).join(' ')).toLowerCase();

  if (content.includes('ecommerce') || content.includes('shop') || content.includes('store') || content.includes('buy')) {
    return 'E-commerce';
  } else if (content.includes('saas') || content.includes('software') || content.includes('platform') || content.includes('api')) {
    return 'SaaS';
  } else if (content.includes('finance') || content.includes('bank') || content.includes('investment') || content.includes('money')) {
    return 'FinTech';
  } else if (content.includes('health') || content.includes('medical') || content.includes('care') || content.includes('wellness')) {
    return 'Healthcare';
  } else if (content.includes('education') || content.includes('course') || content.includes('learn') || content.includes('university')) {
    return 'Education';
  } else if (content.includes('manufacture') || content.includes('industrial') || content.includes('factory')) {
    return 'Manufacturing';
  }

  return 'General';
}

function generateRecommendations(pageData: any, conversionElements: number, trustSignals: number): string[] {
  const recommendations: string[] = [];

  if (pageData.elements.buttons.length === 0) {
    recommendations.push('Add clear call-to-action buttons to improve conversion');
  }

  if (conversionElements < 2) {
    recommendations.push('Consider adding more conversion-focused elements (forms, CTAs)');
  }

  if (trustSignals < 3) {
    recommendations.push('Add trust signals like testimonials, security badges, or guarantees');
  }

  if (pageData.elements.headlines.length === 0) {
    recommendations.push('Add clear headlines to improve page structure and SEO');
  }

  if (pageData.title.length < 30) {
    recommendations.push('Consider a more descriptive page title for better SEO');
  }

  if (!pageData.description) {
    recommendations.push('Add a meta description to improve search engine visibility');
  }

  return recommendations;
}

export default router;
