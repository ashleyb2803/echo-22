import { useState, useEffect } from 'react';
import './ResourcesPage.css';

// Mock resources service - replace with actual service
const resourcesService = {
  async getResources(category = null, priority = null) {
    // TODO: Replace with actual API call
    const mockResources = {
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
          title: 'PTSD Coach App',
          description: 'Self-help app for PTSD symptoms',
          website: 'https://www.ptsd.va.gov/appvid/mobile/ptsdcoach_app.asp',
          category: 'selfcare',
          priority: 2
        }
      ]
    };

    let resources = [];
    if (category) {
      resources = mockResources[category] || [];
    } else {
      Object.values(mockResources).forEach(categoryResources => {
        resources = resources.concat(categoryResources);
      });
    }

    if (priority) {
      resources = resources.filter(resource => resource.priority <= parseInt(priority));
    }

    resources.sort((a, b) => a.priority - b.priority);

    return {
      resources,
      categories: Object.keys(mockResources),
      total: resources.length
    };
  },

  async getCategories() {
    return {
      categories: [
        {
          id: 'crisis',
          name: 'Crisis Support',
          count: 3,
          description: 'Immediate help for mental health emergencies',
          icon: '🚨'
        },
        {
          id: 'military',
          name: 'Military & Veterans',
          count: 3,
          description: 'Resources specifically for military personnel and veterans',
          icon: '🎖️'
        },
        {
          id: 'therapy',
          name: 'Professional Help',
          count: 2,
          description: 'Professional mental health treatment options',
          icon: '👩‍⚕️'
        },
        {
          id: 'selfcare',
          name: 'Self-Care Tools',
          count: 2,
          description: 'Self-help tools and apps for daily mental health',
          icon: '🧘‍♀️'
        }
      ]
    };
  }
};

export default function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCategories();
    loadResources();
  }, []);

  useEffect(() => {
    loadResources(selectedCategory);
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      const response = await resourcesService.getCategories();
      setCategories(response.categories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadResources = async (category = null) => {
    setLoading(true);
    try {
      const response = await resourcesService.getResources(category);
      setResources(response.resources);
    } catch (error) {
      setError('Failed to load resources');
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResources = resources.filter(resource =>
    resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryInfo = (categoryId) => {
    return categories.find(cat => cat.id === categoryId);
  };

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  const handleCallPhone = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  const handleSendText = (number) => {
    window.location.href = `sms:${number}`;
  };

  const handleVisitWebsite = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="resources-page">
      <header className="page-header">
        <h1>📚 Mental Health Resources</h1>
        <p>Professional support, crisis help, and self-care tools for your journey</p>
      </header>

      {/* Emergency Banner */}
      <div className="emergency-banner">
        <div className="emergency-content">
          <div className="emergency-icon">🚨</div>
          <div className="emergency-text">
            <h3>In Crisis? Get Help Now</h3>
            <p>If you're in immediate danger or having thoughts of self-harm</p>
          </div>
          <div className="emergency-actions">
            <button 
              className="emergency-btn"
              onClick={() => handleCallPhone('988')}
            >
              📞 Call 988
            </button>
            <button 
              className="emergency-btn"
              onClick={() => handleSendText('741741')}
            >
              💬 Text 741741
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} className="alert-close">×</button>
        </div>
      )}

      {/* Search */}
      <div className="search-section">
        <input
          type="text"
          placeholder="Search resources..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Category Filter */}
      <div className="categories-section">
        <h2>Browse by Category</h2>
        <div className="categories-grid">
          <button
            className={`category-card ${selectedCategory === null ? 'active' : ''}`}
            onClick={() => handleCategoryClick(null)}
          >
            <div className="category-icon">📋</div>
            <div className="category-info">
              <h3>All Resources</h3>
              <p>View all available resources</p>
              <span className="category-count">{resources.length} resources</span>
            </div>
          </button>

          {categories.map(category => (
            <button
              key={category.id}
              className={`category-card ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => handleCategoryClick(category.id)}
            >
              <div className="category-icon">{category.icon}</div>
              <div className="category-info">
                <h3>{category.name}</h3>
                <p>{category.description}</p>
                <span className="category-count">{category.count} resources</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Resources List */}
      <div className="resources-section">
        {selectedCategory && (
          <div className="section-header">
            <h2>
              {getCategoryInfo(selectedCategory)?.icon} {getCategoryInfo(selectedCategory)?.name}
            </h2>
            <p>{getCategoryInfo(selectedCategory)?.description}</p>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading resources...</p>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No resources found</h3>
            <p>Try adjusting your search or browse different categories</p>
          </div>
        ) : (
          <div className="resources-grid">
            {filteredResources.map(resource => (
              <div key={resource.id} className="resource-card">
                <div className="resource-header">
                  <h3 className="resource-title">{resource.title}</h3>
                  <div className={`priority-badge priority-${resource.priority}`}>
                    {resource.priority === 1 ? 'High Priority' : resource.priority === 2 ? 'Important' : 'Helpful'}
                  </div>
                </div>

                <p className="resource-description">{resource.description}</p>

                <div className="resource-actions">
                  {resource.phone && (
                    <button
                      className="resource-btn phone-btn"
                      onClick={() => handleCallPhone(resource.phone)}
                      title={`Call ${resource.phone}`}
                    >
                      📞 {resource.phone}
                    </button>
                  )}

                  {resource.text && (
                    <button
                      className="resource-btn text-btn"
                      onClick={() => handleSendText(resource.text)}
                      title={`Text ${resource.text}`}
                    >
                      💬 Text {resource.text}
                    </button>
                  )}

                  {resource.website && (
                    <button
                      className="resource-btn website-btn"
                      onClick={() => handleVisitWebsite(resource.website)}
                      title="Visit website"
                    >
                      🌐 Visit Website
                    </button>
                  )}
                </div>

                <div className="resource-category">
                  <span className="category-tag">
                    {getCategoryInfo(resource.category)?.icon} {getCategoryInfo(resource.category)?.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Additional Info */}
      <div className="info-section">
        <div className="info-card">
          <h3>🔒 Your Privacy Matters</h3>
          <p>
            All resources listed here are external services. Echo 22 does not track your 
            usage of these resources. Your privacy and confidentiality are important.
          </p>
        </div>

        <div className="info-card">
          <h3>💡 How to Use These Resources</h3>
          <ul>
            <li><strong>Crisis Resources:</strong> Available 24/7 for immediate help</li>
            <li><strong>Professional Help:</strong> For ongoing therapy and treatment</li>
            <li><strong>Self-Care Tools:</strong> Apps and techniques for daily wellness</li>
            <li><strong>Military Specific:</strong> Specialized support for service members</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>📋 Disclaimer</h3>
          <p>
            Echo 22 provides these resources for informational purposes. We are not 
            responsible for the content or services of external organizations. 
            Always consult with healthcare professionals for medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}