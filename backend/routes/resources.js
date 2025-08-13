const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

// Static mental health resources - you can move this to a database later
const mentalHealthResources = {
  crisis: [
    {
      id: 'crisis-1',
      title: '988 Suicide & Crisis Lifeline',
      description: '24/7, free and confidential support for people in distress',
      phone: '988',
      website: 'https://988lifeline.org',
      category: 'crisis',
      priority: 1
    },
    {
      id: 'crisis-2',
      title: 'Veterans Crisis Line',
      description: 'Confidential help for Veterans in crisis and their families',
      phone: '1-800-273-8255',
      website: 'https://www.veteranscrisisline.net',
      category: 'crisis',
      priority: 1
    },
    {
      id: 'crisis-3',
      title: 'Crisis Text Line',
      description: 'Text HOME to 741741 for crisis support via text message',
      text: '741741',
      website: 'https://www.crisistextline.org',
      category: 'crisis',
      priority: 1
    }
  ],
  military: [
    {
      id: 'mil-1',
      title: 'Military Family Life Counselors (MFLC)',
      description: 'Non-medical counseling support for military families',
      website: 'https://www.militaryfamilylife.org',
      category: 'military',
      priority: 2
    },
    {
      id: 'mil-2',
      title: 'Military OneSource',
      description: 'Free counseling, coaching, and other support services',
      phone: '1-800-342-9647',
      website: 'https://www.militaryonesource.mil',
      category: 'military',
      priority: 2
    },
    {
      id: 'mil-3',
      title: 'Wounded Warrior Project',
      description: 'Mental health programs for wounded veterans',
      phone: '1-888-997-2586',
      website: 'https://www.woundedwarriorproject.org',
      category: 'military',
      priority: 2
    },
    {
      id: 'mil-4',
      title: 'Team Red White & Blue',
      description: 'Veteran community and mental health support',
      website: 'https://www.teamrwb.org',
      category: 'military',
      priority: 3
    }
  ],
  therapy: [
    {
      id: 'therapy-1',
      title: 'Psychology Today Therapist Finder',
      description: 'Find mental health professionals in your area',
      website: 'https://www.psychologytoday.com/us/therapists',
      category: 'therapy',
      priority: 2
    },
    {
      id: 'therapy-2',
      title: 'BetterHelp Online Therapy',
      description: 'Online counseling and therapy services',
      website: 'https://www.betterhelp.com',
      category: 'therapy',
      priority: 3
    },
    {
      id: 'therapy-3',
      title: 'EMDR International Association',
      description: 'Find EMDR therapists for trauma treatment',
      website: 'https://www.emdria.org',
      category: 'therapy',
      priority: 3
    }
  ],
  selfcare: [
    {
      id: 'selfcare-1',
      title: 'Headspace Meditation App',
      description: 'Guided meditation and mindfulness exercises',
      website: 'https://www.headspace.com',
      category: 'selfcare',
      priority: 3
    },
    {
      id: 'selfcare-2',
      title: 'Calm App',
      description: 'Sleep stories, meditation, and relaxation',
      website: 'https://www.calm.com',
      category: 'selfcare',
      priority: 3
    },
    {
      id: 'selfcare-3',
      title: 'PTSD Coach App',
      description: 'Self-help app for PTSD symptoms',
      website: 'https://www.ptsd.va.gov/appvid/mobile/ptsdcoach_app.asp',
      category: 'selfcare',
      priority: 2
    },
    {
      id: 'selfcare-4',
      title: 'Mindfulness-Based Stress Reduction',
      description: 'Learn MBSR techniques for stress management',
      website: 'https://www.mindfulnesscds.com',
      category: 'selfcare',
      priority: 3
    }
  ],
  education: [
    {
      id: 'edu-1',
      title: 'National Institute of Mental Health',
      description: 'Comprehensive mental health information and research',
      website: 'https://www.nimh.nih.gov',
      category: 'education',
      priority: 2
    },
    {
      id: 'edu-2',
      title: 'VA Mental Health Resources',
      description: 'Mental health information and services for veterans',
      website: 'https://www.mentalhealth.va.gov',
      category: 'education',
      priority: 2
    },
    {
      id: 'edu-3',
      title: 'NAMI (National Alliance on Mental Illness)',
      description: 'Mental health education and support groups',
      website: 'https://www.nami.org',
      category: 'education',
      priority: 2
    }
  ]
};

// GET /api/resources - Get all mental health resources
router.get('/', async (req, res) => {
  try {
    const { category, priority } = req.query;
    
    let resources = [];
    
    if (category) {
      // Get specific category
      resources = mentalHealthResources[category] || [];
    } else {
      // Get all resources
      Object.values(mentalHealthResources).forEach(categoryResources => {
        resources = resources.concat(categoryResources);
      });
    }
    
    // Filter by priority if specified
    if (priority) {
      resources = resources.filter(resource => 
        resource.priority <= parseInt(priority)
      );
    }
    
    // Sort by priority (lower number = higher priority)
    resources.sort((a, b) => a.priority - b.priority);
    
    res.json({
      resources,
      categories: Object.keys(mentalHealthResources),
      total: resources.length
    });
    
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ 
      error: 'Failed to fetch resources' 
    });
  }
});

// GET /api/resources/categories - Get resource categories
router.get('/categories', async (req, res) => {
  try {
    const categories = Object.keys(mentalHealthResources).map(key => ({
      id: key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
      count: mentalHealthResources[key].length,
      description: getCategoryDescription(key)
    }));
    
    res.json({ categories });
    
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      error: 'Failed to fetch categories' 
    });
  }
});

// GET /api/resources/emergency - Get emergency/crisis resources only
router.get('/emergency', async (req, res) => {
  try {
    const emergencyResources = mentalHealthResources.crisis;
    
    res.json({
      resources: emergencyResources,
      disclaimer: 'If you are in immediate danger, please call 911 or go to your nearest emergency room.'
    });
    
  } catch (error) {
    console.error('Error fetching emergency resources:', error);
    res.status(500).json({ 
      error: 'Failed to fetch emergency resources' 
    });
  }
});

// POST /api/resources/feedback - Submit feedback on resources (optional)
router.post('/feedback', requireAuth, async (req, res) => {
  try {
    const { resourceId, rating, comment, helpful } = req.body;
    const userId = req.user._id;
    
    // In a real app, you'd save this to a database
    // For now, just log it
    console.log('Resource feedback received:', {
      userId,
      resourceId,
      rating,
      comment,
      helpful,
      timestamp: new Date()
    });
    
    res.json({
      message: 'Thank you for your feedback! This helps us improve our resources.'
    });
    
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ 
      error: 'Failed to submit feedback' 
    });
  }
});

// Helper function to get category descriptions
function getCategoryDescription(category) {
  const descriptions = {
    crisis: 'Immediate help for mental health emergencies',
    military: 'Resources specifically for military personnel and veterans',
    therapy: 'Professional mental health treatment options',
    selfcare: 'Self-help tools and apps for daily mental health',
    education: 'Learn more about mental health conditions and treatments'
  };
  
  return descriptions[category] || 'Mental health resources';
}

module.exports = router;