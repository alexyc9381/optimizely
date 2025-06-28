import express from 'express';
import {
    EmailCategory,
    emailSequenceEngine,
    ProviderType,
    SubscriptionStatus,
    TriggerType
} from '../services/universal-automated-email-sequence-engine';

const router = express.Router();

// =============================================================================
// UNIVERSAL CORS & SECURITY HEADERS
// =============================================================================

router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('X-API-Version', '1.0');
  res.header('X-Service', 'Universal-Email-Sequence-Engine');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// =============================================================================
// EMAIL TEMPLATE MANAGEMENT
// =============================================================================

// Create Email Template
router.post('/templates', async (req, res) => {
  try {
    const {
      name,
      subject,
      htmlContent,
      textContent,
      variables = [],
      metadata,
      tags = [],
      isActive = true,
      createdBy
    } = req.body;

    if (!name || !subject) {
      return res.status(400).json({
        success: false,
        error: 'Template name and subject are required'
      });
    }

    if (!htmlContent && !textContent) {
      return res.status(400).json({
        success: false,
        error: 'Template must have either HTML or text content'
      });
    }

    const template = await emailSequenceEngine.createTemplate({
      name,
      subject,
      htmlContent: htmlContent || '',
      textContent: textContent || '',
      variables,
      metadata: metadata || {
        category: EmailCategory.NURTURE,
        industry: [],
        useCase: [],
        complexity: 'simple',
        estimatedOpenRate: 0,
        estimatedClickRate: 0,
        language: 'en'
      },
      tags,
      isActive,
      createdBy: createdBy || 'api'
    });

    res.json({
      success: true,
      message: 'Email template created successfully',
      data: {
        template
      }
    });

  } catch (error: any) {
    console.error('❌ Error creating email template:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create email template'
    });
  }
});

// Get All Templates
router.get('/templates', async (req, res) => {
  try {
    const { category, isActive, search } = req.query;

    let templates = emailSequenceEngine.getAllTemplates();

    // Filter by category
    if (category) {
      templates = templates.filter(t => t.metadata.category === category);
    }

    // Filter by active status
    if (isActive !== undefined) {
      const activeFilter = isActive === 'true';
      templates = templates.filter(t => t.isActive === activeFilter);
    }

    // Search filter
    if (search) {
      const searchTerm = String(search).toLowerCase();
      templates = templates.filter(t =>
        t.name.toLowerCase().includes(searchTerm) ||
        t.subject.toLowerCase().includes(searchTerm) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    res.json({
      success: true,
      message: 'Templates retrieved successfully',
      data: {
        templates,
        count: templates.length,
        filters: {
          category,
          isActive,
          search
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Error retrieving templates:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve templates'
    });
  }
});

// Get Template by ID
router.get('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const template = emailSequenceEngine.getTemplate(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    res.json({
      success: true,
      message: 'Template retrieved successfully',
      data: {
        template
      }
    });

  } catch (error: any) {
    console.error('❌ Error retrieving template:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve template'
    });
  }
});

// Update Template
router.put('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const template = await emailSequenceEngine.updateTemplate(id, updates);

    res.json({
      success: true,
      message: 'Template updated successfully',
      data: {
        template
      }
    });

  } catch (error: any) {
    console.error('❌ Error updating template:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update template'
    });
  }
});

// Delete Template
router.delete('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await emailSequenceEngine.deleteTemplate(id);

    res.json({
      success: true,
      message: 'Template deleted successfully',
      data: {
        id
      }
    });

  } catch (error: any) {
    console.error('❌ Error deleting template:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete template'
    });
  }
});

// Clone Template
router.post('/templates/:id/clone', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Template name is required for cloning'
      });
    }

    const clonedTemplate = await emailSequenceEngine.cloneTemplate(id, name);

    res.json({
      success: true,
      message: 'Template cloned successfully',
      data: {
        template: clonedTemplate
      }
    });

  } catch (error: any) {
    console.error('❌ Error cloning template:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to clone template'
    });
  }
});

// Get Templates by Category
router.get('/templates/category/:category', async (req, res) => {
  try {
    const { category } = req.params;

    if (!Object.values(EmailCategory).includes(category as EmailCategory)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email category'
      });
    }

    const templates = emailSequenceEngine.getTemplatesByCategory(category as EmailCategory);

    res.json({
      success: true,
      message: 'Templates retrieved by category successfully',
      data: {
        templates,
        category,
        count: templates.length
      }
    });

  } catch (error: any) {
    console.error('❌ Error retrieving templates by category:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve templates by category'
    });
  }
});

// =============================================================================
// EMAIL SEQUENCE MANAGEMENT
// =============================================================================

// Create Email Sequence
router.post('/sequences', async (req, res) => {
  try {
    const {
      name,
      description,
      steps,
      triggers,
      segmentation,
      settings,
      abTesting,
      isActive = false,
      createdBy
    } = req.body;

    if (!name || !steps || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Sequence name and at least one step are required'
      });
    }

    const sequence = await emailSequenceEngine.createSequence({
      name,
      description: description || '',
      isActive,
      steps,
      triggers: triggers || [],
      segmentation: segmentation || {
        includeRules: [],
        excludeRules: [],
        dynamicSegmentation: false,
        segmentRefreshInterval: 3600
      },
      settings: settings || {
        timezone: 'UTC',
        sendLimits: {
          maxPerHour: 100,
          maxPerDay: 1000,
          respectTimeZones: true,
          avoidWeekends: false,
          avoidHolidays: true
        },
        unsubscribeHandling: {
          includeUnsubscribeLink: true,
          oneClickUnsubscribe: true,
          resubscribeFlow: false
        },
        deliverabilitySettings: {
          warmupEnabled: false,
          spamFiltering: true,
          authenticationRequired: true,
          monitorBounces: true,
          monitorComplaints: true,
          suppressionListSync: true
        },
        personalisation: {
          useAI: false,
          personalizeSubject: true,
          personalizeContent: true,
          personalizeTimezone: true,
          dynamicContent: false
        }
      },
      abTesting: abTesting || {
        enabled: false,
        testType: 'subject',
        variants: [],
        allocation: {
          strategy: 'equal'
        },
        successMetric: 'open_rate',
        duration: 7,
        minSampleSize: 100,
        significanceLevel: 0.95
      },
      createdBy: createdBy || 'api'
    });

    res.json({
      success: true,
      message: 'Email sequence created successfully',
      data: {
        sequence
      }
    });

  } catch (error: any) {
    console.error('❌ Error creating email sequence:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create email sequence'
    });
  }
});

// Get All Sequences
router.get('/sequences', async (req, res) => {
  try {
    const { isActive, search } = req.query;

    let sequences = emailSequenceEngine.getAllSequences();

    // Filter by active status
    if (isActive !== undefined) {
      const activeFilter = isActive === 'true';
      sequences = sequences.filter(s => s.isActive === activeFilter);
    }

    // Search filter
    if (search) {
      const searchTerm = String(search).toLowerCase();
      sequences = sequences.filter(s =>
        s.name.toLowerCase().includes(searchTerm) ||
        s.description.toLowerCase().includes(searchTerm)
      );
    }

    res.json({
      success: true,
      message: 'Sequences retrieved successfully',
      data: {
        sequences,
        count: sequences.length,
        filters: {
          isActive,
          search
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Error retrieving sequences:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve sequences'
    });
  }
});

// Get Active Sequences
router.get('/sequences/active', async (req, res) => {
  try {
    const sequences = emailSequenceEngine.getActiveSequences();

    res.json({
      success: true,
      message: 'Active sequences retrieved successfully',
      data: {
        sequences,
        count: sequences.length
      }
    });

  } catch (error: any) {
    console.error('❌ Error retrieving active sequences:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve active sequences'
    });
  }
});

// Get Sequence by ID
router.get('/sequences/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sequence = emailSequenceEngine.getSequence(id);

    if (!sequence) {
      return res.status(404).json({
        success: false,
        error: 'Sequence not found'
      });
    }

    res.json({
      success: true,
      message: 'Sequence retrieved successfully',
      data: {
        sequence
      }
    });

  } catch (error: any) {
    console.error('❌ Error retrieving sequence:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve sequence'
    });
  }
});

// Update Sequence
router.put('/sequences/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const sequence = await emailSequenceEngine.updateSequence(id, updates);

    res.json({
      success: true,
      message: 'Sequence updated successfully',
      data: {
        sequence
      }
    });

  } catch (error: any) {
    console.error('❌ Error updating sequence:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update sequence'
    });
  }
});

// Delete Sequence
router.delete('/sequences/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await emailSequenceEngine.deleteSequence(id);

    res.json({
      success: true,
      message: 'Sequence deleted successfully',
      data: {
        id
      }
    });

  } catch (error: any) {
    console.error('❌ Error deleting sequence:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete sequence'
    });
  }
});

// Trigger Sequence for Contact
router.post('/sequences/:id/trigger', async (req, res) => {
  try {
    const { id } = req.params;
    const { contactId, triggerData } = req.body;

    if (!contactId) {
      return res.status(400).json({
        success: false,
        error: 'Contact ID is required'
      });
    }

    const sequenceRun = await emailSequenceEngine.triggerSequence(id, contactId, triggerData);

    res.json({
      success: true,
      message: 'Sequence triggered successfully',
      data: {
        sequenceRun
      }
    });

  } catch (error: any) {
    console.error('❌ Error triggering sequence:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to trigger sequence'
    });
  }
});

// Cancel Sequence Run
router.post('/sequences/runs/:runId/cancel', async (req, res) => {
  try {
    const { runId } = req.params;

    await emailSequenceEngine.cancelSequenceRun(runId);

    res.json({
      success: true,
      message: 'Sequence run cancelled successfully',
      data: {
        runId
      }
    });

  } catch (error: any) {
    console.error('❌ Error cancelling sequence run:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cancel sequence run'
    });
  }
});

// =============================================================================
// CONTACT MANAGEMENT
// =============================================================================

// Add Contact
router.post('/contacts', async (req, res) => {
  try {
    const {
      email,
      firstName,
      lastName,
      customFields = {},
      tags = [],
      segments = [],
      subscriptionStatus = SubscriptionStatus.SUBSCRIBED,
      timezone,
      preferences
    } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Check if contact already exists
    const existingContact = emailSequenceEngine.getContactByEmail(email);
    if (existingContact) {
      return res.status(409).json({
        success: false,
        error: 'Contact with this email already exists',
        data: {
          existingContact
        }
      });
    }

    const contact = await emailSequenceEngine.addContact({
      email,
      firstName,
      lastName,
      customFields,
      tags,
      segments,
      subscriptionStatus,
      timezone,
      preferences: preferences || {
        frequency: 'weekly',
        categories: []
      }
    });

    res.json({
      success: true,
      message: 'Contact added successfully',
      data: {
        contact
      }
    });

  } catch (error: any) {
    console.error('❌ Error adding contact:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to add contact'
    });
  }
});

// Get All Contacts
router.get('/contacts', async (req, res) => {
  try {
    const { subscriptionStatus, search, tags, limit = 100, offset = 0 } = req.query;

    let contacts = emailSequenceEngine.getAllContacts();

    // Filter by subscription status
    if (subscriptionStatus) {
      contacts = contacts.filter(c => c.subscriptionStatus === subscriptionStatus);
    }

    // Search filter
    if (search) {
      const searchTerm = String(search).toLowerCase();
      contacts = contacts.filter(c =>
        c.email.toLowerCase().includes(searchTerm) ||
        (c.firstName && c.firstName.toLowerCase().includes(searchTerm)) ||
        (c.lastName && c.lastName.toLowerCase().includes(searchTerm))
      );
    }

    // Filter by tags
    if (tags) {
      const tagList = String(tags).split(',');
      contacts = contacts.filter(c =>
        tagList.some(tag => c.tags.includes(tag.trim()))
      );
    }

    // Pagination
    const limitNum = Math.min(parseInt(String(limit)), 1000);
    const offsetNum = parseInt(String(offset));
    const paginatedContacts = contacts.slice(offsetNum, offsetNum + limitNum);

    res.json({
      success: true,
      message: 'Contacts retrieved successfully',
      data: {
        contacts: paginatedContacts,
        pagination: {
          total: contacts.length,
          limit: limitNum,
          offset: offsetNum,
          hasMore: offsetNum + limitNum < contacts.length
        },
        filters: {
          subscriptionStatus,
          search,
          tags
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Error retrieving contacts:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve contacts'
    });
  }
});

// Get Contact by ID
router.get('/contacts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const contact = emailSequenceEngine.getContact(id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }

    res.json({
      success: true,
      message: 'Contact retrieved successfully',
      data: {
        contact
      }
    });

  } catch (error: any) {
    console.error('❌ Error retrieving contact:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve contact'
    });
  }
});

// Get Contact by Email
router.get('/contacts/email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const contact = emailSequenceEngine.getContactByEmail(decodeURIComponent(email));

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }

    res.json({
      success: true,
      message: 'Contact retrieved successfully',
      data: {
        contact
      }
    });

  } catch (error: any) {
    console.error('❌ Error retrieving contact by email:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve contact'
    });
  }
});

// Update Contact
router.put('/contacts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const contact = await emailSequenceEngine.updateContact(id, updates);

    res.json({
      success: true,
      message: 'Contact updated successfully',
      data: {
        contact
      }
    });

  } catch (error: any) {
    console.error('❌ Error updating contact:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update contact'
    });
  }
});

// =============================================================================
// ANALYTICS & REPORTING
// =============================================================================

// Get Sequence Analytics
router.get('/sequences/:id/analytics', async (req, res) => {
  try {
    const { id } = req.params;
    const sequence = emailSequenceEngine.getSequence(id);

    if (!sequence) {
      return res.status(404).json({
        success: false,
        error: 'Sequence not found'
      });
    }

    res.json({
      success: true,
      message: 'Sequence analytics retrieved successfully',
      data: {
        analytics: sequence.analytics,
        sequence: {
          id: sequence.id,
          name: sequence.name,
          isActive: sequence.isActive
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Error retrieving sequence analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve sequence analytics'
    });
  }
});

// Get Overall Analytics Dashboard
router.get('/analytics/dashboard', async (req: express.Request, res: express.Response) => {
  try {
    const sequences = emailSequenceEngine.getAllSequences();
    const contacts = emailSequenceEngine.getAllContacts();

    const totalSequences = sequences.length;
    const activeSequences = sequences.filter(s => s.isActive).length;
    const totalContacts = contacts.length;
    const subscribedContacts = contacts.filter(c => c.subscriptionStatus === SubscriptionStatus.SUBSCRIBED).length;

    // Aggregate analytics from all sequences
    const aggregatedAnalytics = sequences.reduce((acc, sequence) => {
      acc.totalContacts += sequence.analytics.enrolled;
      acc.emailsSent += sequence.analytics.totalSent;
      acc.emailsOpened += sequence.analytics.totalOpened;
      acc.emailsClicked += sequence.analytics.totalClicked;
      acc.conversions += sequence.analytics.totalConverted;
      acc.revenue += sequence.analytics.totalRevenue;
      acc.bounces += sequence.analytics.totalSent - sequence.analytics.totalDelivered; // Calculate bounces
      acc.unsubscribes += sequence.analytics.unsubscribed;
      return acc;
    }, {
      totalContacts: 0,
      emailsSent: 0,
      emailsOpened: 0,
      emailsClicked: 0,
      conversions: 0,
      revenue: 0,
      bounces: 0,
      unsubscribes: 0
    });

    // Calculate rates
    const openRate = aggregatedAnalytics.emailsSent > 0 ?
      (aggregatedAnalytics.emailsOpened / aggregatedAnalytics.emailsSent * 100) : 0;
    const clickRate = aggregatedAnalytics.emailsSent > 0 ?
      (aggregatedAnalytics.emailsClicked / aggregatedAnalytics.emailsSent * 100) : 0;
    const conversionRate = aggregatedAnalytics.emailsSent > 0 ?
      (aggregatedAnalytics.conversions / aggregatedAnalytics.emailsSent * 100) : 0;
    const bounceRate = aggregatedAnalytics.emailsSent > 0 ?
      (aggregatedAnalytics.bounces / aggregatedAnalytics.emailsSent * 100) : 0;

    res.json({
      success: true,
      message: 'Analytics dashboard retrieved successfully',
      data: {
        overview: {
          totalSequences,
          activeSequences,
          totalContacts,
          subscribedContacts
        },
        performance: {
          emailsSent: aggregatedAnalytics.emailsSent,
          emailsOpened: aggregatedAnalytics.emailsOpened,
          emailsClicked: aggregatedAnalytics.emailsClicked,
          conversions: aggregatedAnalytics.conversions,
          unsubscribes: aggregatedAnalytics.unsubscribes,
          openRate: Math.round(openRate * 100) / 100,
          clickRate: Math.round(clickRate * 100) / 100,
          conversionRate: Math.round(conversionRate * 100) / 100,
          bounceRate: Math.round(bounceRate * 100) / 100,
          revenue: aggregatedAnalytics.revenue
        },
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('❌ Error retrieving analytics dashboard:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve analytics dashboard'
    });
  }
});

// =============================================================================
// HEALTH & STATUS
// =============================================================================

// Health Check
router.get('/health', async (req, res) => {
  try {
    const sequences = emailSequenceEngine.getAllSequences();
    const templates = emailSequenceEngine.getAllTemplates();
    const contacts = emailSequenceEngine.getAllContacts();

    const healthData = {
      status: 'healthy',
      service: 'Universal Automated Email Sequence Engine',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      statistics: {
        totalSequences: sequences.length,
        activeSequences: sequences.filter(s => s.isActive).length,
        totalTemplates: templates.length,
        activeTemplates: templates.filter(t => t.isActive).length,
        totalContacts: contacts.length,
        subscribedContacts: contacts.filter(c => c.subscriptionStatus === SubscriptionStatus.SUBSCRIBED).length
      },
      features: {
        templateManagement: true,
        sequenceAutomation: true,
        contactManagement: true,
        analytics: true,
        abTesting: true,
        deliverabilityMonitoring: true,
        segmentation: true,
        personalization: true
      }
    };

    res.json({
      success: true,
      data: healthData
    });

  } catch (error: any) {
    console.error('❌ Error in health check:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Health check failed',
      status: 'unhealthy'
    });
  }
});

// Service Info
router.get('/info', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        service: 'Universal Automated Email Sequence Engine',
        description: 'Comprehensive email automation platform with intelligent sequencing, A/B testing, and deliverability optimization',
        version: '1.0.0',
        apiVersion: '1.0',
        capabilities: {
          templateManagement: 'Create, edit, and manage email templates with variables and personalization',
          sequenceAutomation: 'Build complex email sequences with triggers, conditions, and timing controls',
          contactManagement: 'Manage contact lists with segmentation and preference tracking',
          abTesting: 'A/B test subjects, content, timing, and full emails',
          analytics: 'Comprehensive reporting and performance analytics',
          deliverability: 'Monitor bounce rates, spam complaints, and sender reputation',
          personalization: 'AI-powered content personalization and dynamic variables',
          multiProviderSupport: 'Support for multiple email service providers',
          apiFirst: 'RESTful API-first design for universal platform compatibility'
        },
        supportedCategories: Object.values(EmailCategory),
        supportedTriggers: Object.values(TriggerType),
        supportedProviders: Object.values(ProviderType)
      }
    });

  } catch (error: any) {
    console.error('❌ Error retrieving service info:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve service info'
    });
  }
});

export default router;
