import express from 'express';
import https from 'https';
import { URL } from 'url';

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
      // Simple HTML fetch and basic parsing
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        redirect: 'follow'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const loadTime = Date.now() - startTime;

      // Basic HTML parsing (simple regex-based extraction)
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : 'Untitled Page';

      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
      const description = descMatch ? descMatch[1].trim() : '';

      const viewportMatch = html.match(/<meta[^>]*name=["']viewport["'][^>]*content=["']([^"']*)["']/i);
      const mobileOptimized = viewportMatch ? viewportMatch[1].includes('width=device-width') : false;

      // Extract headlines
      const headlineMatches = html.match(/<h[1-6][^>]*>([^<]*)<\/h[1-6]>/gi) || [];
      const headlines = headlineMatches.map((match, index) => {
        const levelMatch = match.match(/<h([1-6])/i);
        const textMatch = match.match(/>([^<]*)</);
        return {
          text: textMatch ? textMatch[1].trim().substring(0, 200) : '',
          level: levelMatch ? parseInt(levelMatch[1]) : 1,
          location: `H${levelMatch ? levelMatch[1] : '1'} ${index + 1}`
        };
      }).filter(h => h.text);

      // Extract buttons (basic detection)
      const buttonMatches = html.match(/<button[^>]*>([^<]*)<\/button>|<input[^>]*type=["'](?:button|submit)["'][^>]*>/gi) || [];
      const buttons = buttonMatches.map((match, index) => {
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
          prominence: 5 // Default prominence
        };
      }).filter(btn => btn.text);

      // Extract images
      const imageMatches = html.match(/<img[^>]*>/gi) || [];
      const images = imageMatches.map((match, index) => {
        const altMatch = match.match(/alt=["']([^"']*)["']/i);
        const srcMatch = match.match(/src=["']([^"']*)["']/i);
        return {
          alt: altMatch ? altMatch[1].substring(0, 100) : '',
          src: srcMatch ? srcMatch[1].substring(0, 200) : '',
          location: `Image ${index + 1}`
        };
      }).filter(img => img.src);

      // Extract forms (basic detection)
      const formMatches = html.match(/<form[^>]*>[\s\S]*?<\/form>/gi) || [];
      const forms = formMatches.map((match, index) => {
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

      // Count trust signals
      const lowerHTML = html.toLowerCase();
      const trustWords = ['secure', 'ssl', 'encrypted', 'verified', 'certified', 'guarantee', 'testimonial', 'review'];
      const trustSignals = trustWords.filter(word => lowerHTML.includes(word)).length;

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
      console.error('Page scanning error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to scan page. Please ensure the URL is publicly accessible and try again.'
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
