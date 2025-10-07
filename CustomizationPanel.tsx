import React, { useState, useEffect } from 'react';
import './design-system.css';
import './CustomizationPanel.css';
import './CustomizationPanel.css';

// Types for customization options
export interface CustomizationOptions {
  tone: 'professional' | 'enthusiastic' | 'luxury' | 'friendly' | 'formal';
  length: 'short' | 'medium' | 'long' | 'detailed';
  includePrice: boolean;
  includeFeatures: boolean;
  includeLocation: boolean;
  language: 'english' | 'afrikaans';
  targetAudience: 'first-time-buyers' | 'investors' | 'families' | 'professionals' | 'retirees';
}

interface CustomizationPanelProps {
  options?: Partial<CustomizationOptions>;
  onOptionsChange?: (options: CustomizationOptions) => void;
  propertyData?: {
    location: string;
    bedrooms: number;
    bathrooms: number;
    price: number;
    keyFeatures: string[];
    propertyType: string;
  };
  generatedDescription?: string;
}

// Predefined tone configurations
const TONE_OPTIONS = [
  {
    id: 'professional',
    name: 'Professional',
    icon: '💼',
    description: 'Formal and informative tone for serious buyers',
    color: '#1f2937',
    sample: 'This exceptional property offers discerning buyers...'
  },
  {
    id: 'enthusiastic',
    name: 'Enthusiastic',
    icon: '😊',
    description: 'Energetic and exciting tone to create interest',
    color: '#f59e0b',
    sample: 'You\'ll absolutely love this amazing home!'
  },
  {
    id: 'luxury',
    name: 'Luxury',
    icon: '✨',
    description: 'Sophisticated tone for premium properties',
    color: '#7c3aed',
    sample: 'Indulge in the epitome of refined living...'
  },
  {
    id: 'friendly',
    name: 'Friendly',
    icon: '👋',
    description: 'Warm and approachable tone for families',
    color: '#10b981',
    sample: 'Welcome to your perfect family home!'
  },
  {
    id: 'formal',
    name: 'Formal',
    icon: '📋',
    description: 'Traditional and structured approach',
    color: '#374151',
    sample: 'We present this distinguished residence...'
  }
] as const;

// Length configurations
const LENGTH_OPTIONS = [
  {
    id: 'short',
    name: 'Short Summary',
    wordCount: '50-80 words',
    description: 'Brief overview for quick reading',
    icon: '📝'
  },
  {
    id: 'medium',
    name: 'Standard Description',
    wordCount: '100-150 words',
    description: 'Balanced detail for most listings',
    icon: '📄'
  },
  {
    id: 'long',
    name: 'Detailed Description',
    wordCount: '200-300 words',
    description: 'Comprehensive information for serious buyers',
    icon: '📋'
  },
  {
    id: 'detailed',
    name: 'Feature-Rich',
    wordCount: '300+ words',
    description: 'Extensive details and highlights',
    icon: '📖'
  }
] as const;

// Target audience options
const AUDIENCE_OPTIONS = [
  { id: 'first-time-buyers', name: 'First-time Buyers', icon: '🏠' },
  { id: 'investors', name: 'Investors', icon: '📈' },
  { id: 'families', name: 'Families', icon: '👨‍👩‍👧‍👦' },
  { id: 'professionals', name: 'Professionals', icon: '💼' },
  { id: 'retirees', name: 'Retirees', icon: '🌅' }
] as const;

const CustomizationPanel: React.FC<CustomizationPanelProps> = ({
  options: initialOptions = {},
  onOptionsChange,
  propertyData,
  generatedDescription
}) => {
  const [customizationOptions, setCustomizationOptions] = useState<CustomizationOptions>({
    tone: 'professional',
    length: 'medium',
    includePrice: true,
    includeFeatures: true,
    includeLocation: true,
    language: 'english',
    targetAudience: 'families',
    ...initialOptions
  });

  const [previewText, setPreviewText] = useState('');
  const [activeTab, setActiveTab] = useState<'tone' | 'length' | 'content' | 'audience'>('tone');

  // Generate preview text based on current options
  const generatePreview = (options: CustomizationOptions): string => {
    if (generatedDescription) {
      return generatedDescription;
    }

    if (!propertyData) {
      return 'Enter your property details to see a preview of your customized description.';
    }

    const { location, bedrooms, bathrooms, price, keyFeatures, propertyType } = propertyData;
    const { tone, length, includePrice, includeFeatures, includeLocation, targetAudience } = options;

    // Base property description
    let description = '';

    // Tone-based opening
    switch (tone) {
      case 'professional':
        description += `This exceptional ${bedrooms}-bedroom ${propertyType} presents an outstanding opportunity for discerning buyers. `;
        break;
      case 'enthusiastic':
        description += `You'll absolutely love this amazing ${bedrooms}-bedroom ${propertyType} that has everything you're looking for! `;
        break;
      case 'luxury':
        description += `Indulge in the epitome of sophisticated living with this stunning ${bedrooms}-bedroom ${propertyType}. `;
        break;
      case 'friendly':
        description += `Welcome to your perfect ${bedrooms}-bedroom ${propertyType} in beautiful ${location}. `;
        break;
      case 'formal':
        description += `We are pleased to present this distinguished ${bedrooms}-bedroom ${propertyType} offering exceptional value. `;
        break;
    }

    // Location (if included)
    if (includeLocation && location) {
      switch (tone) {
        case 'professional':
          description += `Ideally situated in ${location}, `;
          break;
        case 'enthusiastic':
          description += `Located in the fantastic neighborhood of ${location}, `;
          break;
        case 'luxury':
          description += `Nestled in the prestigious enclave of ${location}, `;
          break;
        case 'friendly':
          description += `Set in the welcoming community of ${location}, `;
          break;
        case 'formal':
          description += `Positioned within the desirable area of ${location}, `;
          break;
      }
    }

    // Property details
    switch (tone) {
      case 'professional':
        description += `this residence boasts ${bedrooms} bedrooms, ${bathrooms} bathrooms, and spans ${Math.floor(Math.random() * 200 + 150)} square meters of living space. `;
        break;
      case 'enthusiastic':
        description += `it features ${bedrooms} cozy bedrooms, ${bathrooms} bathrooms, and plenty of space for entertaining! `;
        break;
      case 'luxury':
        description += `it encompasses ${bedrooms} sumptuous bedroom suites, ${bathrooms} luxurious bathrooms, and expansive living areas. `;
        break;
      case 'friendly':
        description += `it offers ${bedrooms} comfortable bedrooms, ${bathrooms} bathrooms, and a warm, inviting atmosphere. `;
        break;
      case 'formal':
        description += `the accommodation comprises ${bedrooms} bedrooms, ${bathrooms} bathrooms, and well-proportioned reception rooms. `;
        break;
    }

    // Price (if included)
    if (includePrice && price) {
      switch (tone) {
        case 'professional':
          description += `Offered at R ${price.toLocaleString()}, this represents excellent value in the current market. `;
          break;
        case 'enthusiastic':
          description += `Priced at just R ${price.toLocaleString()} - what a fantastic deal! `;
          break;
        case 'luxury':
          description += `Priced at R ${price.toLocaleString()}, reflecting its premium position and superior quality. `;
          break;
        case 'friendly':
          description += `Available for R ${price.toLocaleString()} - great value for money! `;
          break;
        case 'formal':
          description += `The property is offered for sale at R ${price.toLocaleString()}. `;
          break;
      }
    }

    // Features (if included)
    if (includeFeatures && keyFeatures.length > 0) {
      switch (tone) {
        case 'professional':
          description += `Premium features include ${keyFeatures.slice(0, 3).join(', ')}${keyFeatures.length > 3 ? ', and more' : ''}. `;
          break;
        case 'enthusiastic':
          description += `You'll love the ${keyFeatures.slice(0, 3).join(', ')} - and that's just the beginning! `;
          break;
        case 'luxury':
          description += `Discerning buyers will appreciate the ${keyFeatures.slice(0, 3).join(', ')}, exemplifying superior craftsmanship. `;
          break;
        case 'friendly':
          description += `The home comes with wonderful features like ${keyFeatures.slice(0, 3).join(', ')} that make life easier. `;
          break;
        case 'formal':
          description += `Additional features include ${keyFeatures.slice(0, 3).join(', ')}. `;
          break;
      }
    }

    // Target audience specific closing
    switch (targetAudience) {
      case 'first-time-buyers':
        description += 'Perfect for first-time buyers looking to step onto the property ladder.';
        break;
      case 'investors':
        description += 'An excellent investment opportunity with strong rental potential.';
        break;
      case 'families':
        description += 'Ideal for families seeking a comfortable and convenient lifestyle.';
        break;
      case 'professionals':
        description += 'Suited for busy professionals who value both comfort and convenience.';
        break;
      case 'retirees':
        description += 'Perfect for those seeking a peaceful and low-maintenance lifestyle.';
        break;
    }

    // Adjust length based on selection
    const targetWordCount = length === 'short' ? 60 : length === 'medium' ? 120 : length === 'long' ? 250 : 350;

    if (description.split(' ').length > targetWordCount) {
      const words = description.split(' ');
      description = words.slice(0, targetWordCount - 20).join(' ') + '...';
    }

    return description;
  };

  // Update preview when options change
  useEffect(() => {
    setPreviewText(generatePreview(customizationOptions));
  }, [customizationOptions, propertyData]);

  // Handle option changes
  const handleOptionChange = (key: keyof CustomizationOptions, value: any) => {
    const newOptions = { ...customizationOptions, [key]: value };
    setCustomizationOptions(newOptions);
    onOptionsChange?.(newOptions);
  };

  const tabs = [
    { id: 'tone', name: 'Tone', icon: '🎭' },
    { id: 'length', name: 'Length', icon: '📏' },
    { id: 'content', name: 'Content', icon: '📝' },
    { id: 'audience', name: 'Audience', icon: '👥' }
  ];

  return (
    <div className="customization-panel-container">
      <div className="customization-panel-wrapper">
        {/* Header */}
        <div className="panel-header">
          <h2 className="panel-title">Customize Your Description</h2>
          <p className="panel-subtitle">
            Tailor the tone, length, and content to match your style and target audience
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-name">{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Tone Tab */}
          {activeTab === 'tone' && (
            <div className="tab-pane">
              <h3 className="tab-pane-title">Choose Your Tone</h3>
              <p className="tab-pane-description">
                Select the writing style that best matches your brand and target audience
              </p>

              <div className="tone-options">
                {TONE_OPTIONS.map(tone => (
                  <div
                    key={tone.id}
                    className={`tone-option ${customizationOptions.tone === tone.id ? 'selected' : ''}`}
                    onClick={() => handleOptionChange('tone', tone.id)}
                  >
                    <div className="tone-header">
                      <div className="tone-icon" style={{ backgroundColor: tone.color }}>
                        {tone.icon}
                      </div>
                      <div className="tone-info">
                        <h4 className="tone-name">{tone.name}</h4>
                        <p className="tone-description">{tone.description}</p>
                      </div>
                    </div>
                    <div className="tone-sample">
                      "{tone.sample}"
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Length Tab */}
          {activeTab === 'length' && (
            <div className="tab-pane">
              <h3 className="tab-pane-title">Description Length</h3>
              <p className="tab-pane-description">
                Choose how detailed you want your property description to be
              </p>

              <div className="length-options">
                {LENGTH_OPTIONS.map(length => (
                  <div
                    key={length.id}
                    className={`length-option ${customizationOptions.length === length.id ? 'selected' : ''}`}
                    onClick={() => handleOptionChange('length', length.id)}
                  >
                    <div className="length-icon">{length.icon}</div>
                    <div className="length-info">
                      <h4 className="length-name">{length.name}</h4>
                      <p className="length-description">{length.description}</p>
                      <span className="length-wordcount">{length.wordCount} words</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="tab-pane">
              <h3 className="tab-pane-title">Content Preferences</h3>
              <p className="tab-pane-description">
                Choose which elements to include in your description
              </p>

              <div className="content-options">
                <label className="content-toggle">
                  <input
                    type="checkbox"
                    checked={customizationOptions.includePrice}
                    onChange={(e) => handleOptionChange('includePrice', e.target.checked)}
                  />
                  <span className="toggle-switch"></span>
                  <span className="toggle-label">Include Price</span>
                </label>

                <label className="content-toggle">
                  <input
                    type="checkbox"
                    checked={customizationOptions.includeFeatures}
                    onChange={(e) => handleOptionChange('includeFeatures', e.target.checked)}
                  />
                  <span className="toggle-switch"></span>
                  <span className="toggle-label">Include Key Features</span>
                </label>

                <label className="content-toggle">
                  <input
                    type="checkbox"
                    checked={customizationOptions.includeLocation}
                    onChange={(e) => handleOptionChange('includeLocation', e.target.checked)}
                  />
                  <span className="toggle-switch"></span>
                  <span className="toggle-label">Include Location Details</span>
                </label>

                <div className="language-selector">
                  <label className="form-label">Language</label>
                  <select
                    className="form-select"
                    value={customizationOptions.language}
                    onChange={(e) => handleOptionChange('language', e.target.value)}
                  >
                    <option value="english">English</option>
                    <option value="afrikaans">Afrikaans</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Audience Tab */}
          {activeTab === 'audience' && (
            <div className="tab-pane">
              <h3 className="tab-pane-title">Target Audience</h3>
              <p className="tab-pane-description">
                Select your primary target audience to optimize the messaging
              </p>

              <div className="audience-options">
                {AUDIENCE_OPTIONS.map(audience => (
                  <div
                    key={audience.id}
                    className={`audience-option ${customizationOptions.targetAudience === audience.id ? 'selected' : ''}`}
                    onClick={() => handleOptionChange('targetAudience', audience.id)}
                  >
                    <div className="audience-icon">{audience.icon}</div>
                    <div className="audience-name">{audience.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Live Preview */}
        <div className="live-preview">
          <div className="preview-header">
            <h3 className="preview-title">Live Preview</h3>
            <div className="preview-controls">
              <button className="btn-secondary">Copy Preview</button>
              <button className="btn-primary">Generate Final</button>
            </div>
          </div>

          <div className="preview-content">
            <div className="preview-text">
              {previewText}
            </div>

            <div className="preview-stats">
              <span className="stat">
                <strong>Tone:</strong> {TONE_OPTIONS.find(t => t.id === customizationOptions.tone)?.name}
              </span>
              <span className="stat">
                <strong>Length:</strong> {LENGTH_OPTIONS.find(l => l.id === customizationOptions.length)?.name}
              </span>
              <span className="stat">
                <strong>Words:</strong> {previewText.split(' ').length}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="panel-actions">
          <button className="btn-outline">Reset to Defaults</button>
          <button className="btn-primary">Apply Customization</button>
        </div>
      </div>
    </div>
  );
};

export default CustomizationPanel;