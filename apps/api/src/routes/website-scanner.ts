import express from 'express';

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
      const apifyToken = process.env.APIFY_TOKEN;

      if (!apifyToken) {
        throw new Error('APIFY_TOKEN environment variable is not set');
      }

      // Call your Apify actor directly via REST API
      console.log(`Starting Apify crawl for URL: ${url}`);
      console.log(`Using Apify token: ${apifyToken ? apifyToken.substring(0, 20) + '...' : 'MISSING'}`);

      const runResponse = await fetch(`https://api.apify.com/v2/acts/aYG0l9s7dbB7j3gbS/runs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apifyToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startUrls: [{ url }]
        })
      });

      if (!runResponse.ok) {
        const errorText = await runResponse.text();
        console.error(`Apify API error: ${runResponse.status} ${runResponse.statusText}`, errorText);
        
        // Parse error response to provide better error messages
        let errorMessage = `Apify API error: ${runResponse.status} ${runResponse.statusText}`;
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error) {
            if (errorData.error.type === 'actor-memory-limit-exceeded') {
              errorMessage = 'Apify memory limit exceeded. Please upgrade your Apify plan or free up memory by stopping other running actors.';
            } else {
              errorMessage = errorData.error.message || errorMessage;
            }
          }
        } catch (parseError) {
          // Use default error message if JSON parsing fails
        }
        
        throw new Error(errorMessage);
      }

      const runData = await runResponse.json();
      const runId = runData.data.id;
      console.log(`Apify run started with ID: ${runId}`);

            // Wait for run to complete (poll status with longer timeout and better error handling)
      let runStatus = 'RUNNING';
      let attempts = 0;
      const maxAttempts = 60; // 60 seconds timeout (Apify can take time)
      let defaultDatasetId = null;

      while (runStatus === 'RUNNING' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between checks

        const statusResponse = await fetch(`https://api.apify.com/v2/acts/aYG0l9s7dbB7j3gbS/runs/${runId}`, {
          headers: {
            'Authorization': `Bearer ${apifyToken}`
          }
        });

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          runStatus = statusData.data.status;
          defaultDatasetId = statusData.data.defaultDatasetId;
          console.log(`Apify run status: ${runStatus}, attempt: ${attempts + 1}/${maxAttempts}`);
        } else {
          console.error(`Failed to check run status: ${statusResponse.status}`);
        }

        attempts++;
      }

      if (runStatus !== 'SUCCEEDED') {
        console.error(`Apify run did not complete successfully. Final status: ${runStatus}`);
        throw new Error(`Apify run failed or timed out. Status: ${runStatus}`);
      }

      if (!defaultDatasetId) {
        throw new Error('No dataset ID found in run data');
      }

      // Get the results from the dataset using the correct dataset ID
      const datasetResponse = await fetch(`https://api.apify.com/v2/datasets/${defaultDatasetId}/items`, {
        headers: {
          'Authorization': `Bearer ${apifyToken}`
        }
      });

      if (!datasetResponse.ok) {
        console.error(`Dataset fetch failed: ${datasetResponse.status} ${datasetResponse.statusText}`);
        throw new Error(`Failed to get dataset: ${datasetResponse.status} ${datasetResponse.statusText}`);
      }

            const crawlResults = await datasetResponse.json();

      console.log(`Dataset response received, item count: ${crawlResults ? crawlResults.length : 0}`);
      if (crawlResults && crawlResults.length > 0) {
        console.log('First item keys:', Object.keys(crawlResults[0]));
      }

      if (!crawlResults || crawlResults.length === 0) {
        throw new Error('No data extracted from the page - your Apify actor may not have produced any output');
      }

      const crawlData = crawlResults[0];
      const loadTime = Date.now() - startTime;

      // Extract and transform data from your crawler results
      const title = crawlData.title || 'Untitled Page';
      const description = crawlData.description || crawlData.metaDescription || '';

      // Parse content elements from crawler data
      const content = crawlData.text || crawlData.content || '';
      const html = crawlData.html || '';

      // Extract headlines from crawler data or HTML
      const headlines = extractHeadlines(crawlData, html);

      // Extract buttons from crawler data or HTML
      const buttons = extractButtons(crawlData, html);

      // Extract images from crawler data
      const images = extractImages(crawlData, html);

      // Extract forms from crawler data or HTML
      const forms = extractForms(crawlData, html);

      // Check mobile optimization
      const mobileOptimized = html.includes('viewport') && html.includes('width=device-width');

      // Count trust signals in content
      const trustWords = ['secure', 'ssl', 'encrypted', 'verified', 'certified', 'guarantee', 'testimonial', 'review'];
      const lowerContent = (content + ' ' + html).toLowerCase();
      const trustSignals = trustWords.filter(word => lowerContent.includes(word)).length;

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
      console.error('Apify crawler error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to crawl page with Apify. Please check your Apify token and try again: ' + (error as Error).message
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
