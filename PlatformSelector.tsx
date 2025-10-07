import React, { useState } from 'react';
import './design-system.css';
import './PlatformSelector.css';
import './PlatformSelector.css';

// Platform type definition
export interface Platform {
  id: 'property24' | 'facebook' | 'whatsapp';
  name: string;
  icon: string;
  color: string;
  description: string;
  audience: string;
  features: string[];
  preview: {
    title: string;
    subtitle: string;
    style: 'formal' | 'social' | 'conversational';
  };
}

// Platform configurations
const PLATFORMS: Platform[] = [
  {
    id: 'property24',
    name: 'Property24',
    icon: '🏠',
    color: '#E85D04',
    description: 'South Africa\'s largest property portal',
    audience: 'Serious property buyers and investors',
    features: ['Professional listings', 'Advanced search filters', 'Direct inquiries', 'Market analytics'],
    preview: {
      title: 'Exclusive Family Home in Prime Location',
      subtitle: 'Modern 3-bedroom house with stunning garden and double garage',
      style: 'formal'
    }
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '📘',
    color: '#1877F2',
    description: 'World\'s largest social network',
    audience: 'Friends, family, and local community',
    features: ['Wide reach', 'Visual content', 'Social engagement', 'Local targeting'],
    preview: {
      title: '😍 Just Listed! Beautiful Family Home',
      subtitle: 'Perfect 3-bed home with garden oasis! Who wants to view? 🏡✨',
      style: 'social'
    }
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: '💬',
    color: '#25D366',
    description: 'Popular messaging platform',
    audience: 'Direct contacts and private groups',
    features: ['Personal sharing', 'Private conversations', 'Quick responses', 'Media rich'],
    preview: {
      title: 'New Listing Alert! 🏠',
      subtitle: '3 bed, 2 bath home with garden - R2,500,000. Perfect for families!',
      style: 'conversational'
    }
  }
];

interface PlatformSelectorProps {
  selectedPlatform?: Platform['id'];
  onPlatformSelect?: (platform: Platform['id']) => void;
  generatedDescription?: string;
  propertyData?: {
    location: string;
    bedrooms: number;
    bathrooms: number;
    price: number;
    keyFeatures: string[];
  };
}

const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  selectedPlatform,
  onPlatformSelect,
  generatedDescription,
  propertyData
}) => {
  const [activePlatform, setActivePlatform] = useState<Platform['id'] | null>(selectedPlatform || null);

  const handlePlatformSelect = (platformId: Platform['id']) => {
    const newPlatform = platformId === activePlatform ? null : platformId;
    setActivePlatform(newPlatform);
    onPlatformSelect?.(newPlatform || platformId);
  };

  const getPlatformPreview = (platform: Platform): string => {
    if (generatedDescription) {
      return generatedDescription;
    }

    if (!propertyData) {
      return `Select a platform to see how your property description will appear on ${platform.name}.`;
    }

    const { location, bedrooms, bathrooms, price, keyFeatures } = propertyData;

    switch (platform.preview.style) {
      case 'formal':
        return `🏠 ${bedrooms} Bedroom House for Sale in ${location}

💰 R ${price.toLocaleString()}
📐 ${bedrooms} bed • ${bathrooms} bath

This exquisite ${bedrooms}-bedroom residence offers an unparalleled living experience in the heart of ${location}.

✨ Premium features include: ${keyFeatures.slice(0, 3).join(', ')}${keyFeatures.length > 3 ? ' and more' : ''}

Contact us today to arrange a private viewing.`;

      case 'social':
        return `😍 NEW LISTING ALERT! 🏠

Just hit the market in ${location}!

${bedrooms} bed • ${bathrooms} bath • R ${price.toLocaleString()}

${keyFeatures.slice(0, 2).join(' • ')} ${keyFeatures.length > 2 ? 'and more amazing features!' : ''}

Who wants to make this their dream home? DM for details! ✨🏡`;

      case 'conversational':
        return `🏠 New Property Listing!

${bedrooms} bed, ${bathrooms} bath house in ${location}
R ${price.toLocaleString()}

Great features: ${keyFeatures.slice(0, 3).join(', ')}${keyFeatures.length > 3 ? '...' : ''}

Perfect for families! Interested?`;

      default:
        return 'Preview will appear here once you generate a description.';
    }
  };

  return (
    <div className="platform-selector-container">
      <div className="platform-selector-wrapper">
        {/* Header */}
        <div className="selector-header">
          <h2 className="selector-title">Choose Your Platform</h2>
          <p className="selector-subtitle">
            Select where you'd like to share your AI-generated property description
          </p>
        </div>

        {/* Platform Selection Grid */}
        <div className="platforms-grid">
          {PLATFORMS.map(platform => (
            <div
              key={platform.id}
              className={`platform-card ${activePlatform === platform.id ? 'selected' : ''}`}
              onClick={() => handlePlatformSelect(platform.id)}
            >
              {/* Platform Header */}
              <div className="platform-header">
                <div className="platform-icon" style={{ backgroundColor: platform.color }}>
                  {platform.icon}
                </div>
                <div className="platform-info">
                  <h3 className="platform-name">{platform.name}</h3>
                  <p className="platform-description">{platform.description}</p>
                </div>
                <div className="platform-checkbox">
                  <input
                    type="radio"
                    checked={activePlatform === platform.id}
                    onChange={() => handlePlatformSelect(platform.id)}
                    name="platform"
                  />
                </div>
              </div>

              {/* Platform Details */}
              <div className="platform-details">
                <div className="platform-audience">
                  <strong>Audience:</strong> {platform.audience}
                </div>

                <div className="platform-features">
                  <strong>Features:</strong>
                  <ul>
                    {platform.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Selection Indicator */}
              {activePlatform === platform.id && (
                <div className="selection-indicator">
                  <div className="checkmark">✓</div>
                  <span>Selected</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Platform Preview */}
        {activePlatform && (
          <div className="platform-preview">
            <div className="preview-header">
              <h3 className="preview-title">
                Preview: How it will appear on {PLATFORMS.find(p => p.id === activePlatform)?.name}
              </h3>
              <div className="preview-actions">
                <button className="btn-secondary">Edit Style</button>
                <button className="btn-primary">Generate Description</button>
              </div>
            </div>

            <div className="preview-content">
              <div className={`preview-platform ${activePlatform}`}>
                <div className="preview-header-row">
                  <div className="preview-platform-info">
                    <div className="preview-icon">
                      {PLATFORMS.find(p => p.id === activePlatform)?.icon}
                    </div>
                    <span className="preview-platform-name">
                      {PLATFORMS.find(p => p.id === activePlatform)?.name}
                    </span>
                  </div>
                  <div className="preview-timestamp">Just now</div>
                </div>

                <div className="preview-text">
                  {getPlatformPreview(PLATFORMS.find(p => p.id === activePlatform)!)}
                </div>

                {/* Platform-specific preview elements */}
                {activePlatform === 'facebook' && (
                  <div className="preview-facebook-actions">
                    <button className="preview-action-btn">👍 Like</button>
                    <button className="preview-action-btn">💬 Comment</button>
                    <button className="preview-action-btn">📤 Share</button>
                  </div>
                )}

                {activePlatform === 'whatsapp' && (
                  <div className="preview-whatsapp-status">
                    <div className="status-indicators">
                      <span className="status-indicator delivered">✓✓ Delivered</span>
                    </div>
                  </div>
                )}

                {activePlatform === 'property24' && (
                  <div className="preview-property24-footer">
                    <div className="property-stats">
                      <span>❤️ 12 favorites</span>
                      <span>👁️ 156 views</span>
                    </div>
                    <button className="contact-btn">Contact Agent</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* No Platform Selected State */}
        {!activePlatform && (
          <div className="no-selection-state">
            <div className="no-selection-icon">🎯</div>
            <h3>Select a platform to see the preview</h3>
            <p>Choose your preferred platform above to see how your property description will appear and get optimized for that specific audience.</p>
          </div>
        )}

        {/* Action Buttons */}
        {activePlatform && (
          <div className="selector-actions">
            <button className="btn-outline">Back to Property Details</button>
            <button className="btn-primary">Continue to Sharing</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlatformSelector;