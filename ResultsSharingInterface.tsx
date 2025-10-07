import React, { useState } from 'react';
import './design-system.css';
import './ResultsSharingInterface.css';
import './ResultsSharingInterface.css';

// Types for results and sharing
export interface GeneratedResult {
  id: string;
  description: string;
  platform: 'property24' | 'facebook' | 'whatsapp';
  tone: string;
  length: string;
  propertyData: {
    location: string;
    bedrooms: number;
    bathrooms: number;
    price: number;
    keyFeatures: string[];
  };
  generatedAt: Date;
  wordCount: number;
  characterCount: number;
}

interface ResultsSharingInterfaceProps {
  result?: GeneratedResult;
  onSaveToHistory?: (result: GeneratedResult) => void;
  onExport?: (format: 'pdf' | 'docx' | 'txt') => void;
  onShareToPlatform?: (platform: 'property24' | 'facebook' | 'whatsapp') => void;
  onNewGeneration?: () => void;
  onEditResult?: (result: GeneratedResult) => void;
}

// Platform sharing configurations
const PLATFORM_SHARING = {
  property24: {
    name: 'Property24',
    icon: '🏠',
    color: '#E85D04',
    url: 'https://property24.com',
    shareText: 'Post to Property24',
    description: 'Share directly to South Africa\'s largest property portal'
  },
  facebook: {
    name: 'Facebook',
    icon: '📘',
    color: '#1877F2',
    url: 'https://facebook.com',
    shareText: 'Share on Facebook',
    description: 'Share with friends and local community'
  },
  whatsapp: {
    name: 'WhatsApp',
    icon: '💬',
    color: '#25D366',
    url: 'https://wa.me',
    shareText: 'Share on WhatsApp',
    description: 'Send to contacts and groups'
  }
};

const ResultsSharingInterface: React.FC<ResultsSharingInterfaceProps> = ({
  result,
  onSaveToHistory,
  onExport,
  onShareToPlatform,
  onNewGeneration,
  onEditResult
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'share' | 'export'>('preview');
  const [copiedText, setCopiedText] = useState('');
  const [showShareOptions, setShowShareOptions] = useState(false);

  // Handle copy to clipboard
  const handleCopyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(type);
      setTimeout(() => setCopiedText(''), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedText(type);
      setTimeout(() => setCopiedText(''), 2000);
    }
  };

  // Handle platform sharing
  const handlePlatformShare = (platform: 'property24' | 'facebook' | 'whatsapp') => {
    if (result) {
      onShareToPlatform?.(platform);
      setShowShareOptions(false);
    }
  };

  // Handle save to history
  const handleSaveToHistory = () => {
    if (result) {
      onSaveToHistory?.(result);
    }
  };

  // Generate platform-optimized versions
  const getPlatformOptimizedVersion = (platform: 'property24' | 'facebook' | 'whatsapp'): string => {
    if (!result) return '';

    const baseDescription = result.description;
    const { propertyData } = result;

    switch (platform) {
      case 'property24':
        // Formal, detailed version for property portal
        return `🏠 EXCLUSIVE LISTING

${baseDescription}

📞 Contact us today to arrange a private viewing
💼 Professional service guaranteed
🌟 Member of the Institute of Estate Agents`;

      case 'facebook':
        // Social, engaging version for Facebook
        return `😍 NEW LISTING ALERT! 🏠

Just hit the market in ${propertyData.location}! 

${baseDescription}

Who wants to make this their dream home? DM for details! ✨🏡

#PropertyForSale #${propertyData.location.replace(/\s+/g, '')} #DreamHome`;

      case 'whatsapp':
        // Concise, conversational version for WhatsApp
        return `🏠 New Property Listing!

${baseDescription}

Perfect for families! Interested?

View more details: [Property Link]`;

      default:
        return baseDescription;
    }
  };

  // Export formats
  const handleExport = (format: 'pdf' | 'docx' | 'txt') => {
    if (result) {
      onExport?.(format);
    }
  };

  const tabs = [
    { id: 'preview', name: 'Preview', icon: '👁️' },
    { id: 'share', name: 'Share', icon: '📤' },
    { id: 'export', name: 'Export', icon: '💾' }
  ];

  if (!result) {
    return (
      <div className="results-container">
        <div className="no-results">
          <div className="no-results-icon">📝</div>
          <h3>No Results Yet</h3>
          <p>Generate your AI description to see results and sharing options here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="results-container">
      <div className="results-wrapper">
        {/* Header */}
        <div className="results-header">
          <div className="header-content">
            <div className="success-badge">
              <div className="badge-icon">✨</div>
              <div className="badge-text">
                <h2>Description Generated</h2>
                <p>Ready to share and export</p>
              </div>
            </div>

            <div className="result-meta">
              <div className="meta-item">
                <span className="meta-label">Platform:</span>
                <span className="meta-value">{result.platform}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Words:</span>
                <span className="meta-value">{result.wordCount}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Generated:</span>
                <span className="meta-value">{result.generatedAt.toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="results-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`results-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-name">{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <div className="preview-tab">
              <div className="description-card">
                <div className="card-header">
                  <h3>Generated Description</h3>
                  <div className="card-actions">
                    <button
                      className="btn-secondary"
                      onClick={() => handleCopyToClipboard(result.description, 'description')}
                    >
                      {copiedText === 'description' ? '✅ Copied!' : '📋 Copy'}
                    </button>
                    <button className="btn-outline" onClick={onEditResult}>
                      ✏️ Edit
                    </button>
                  </div>
                </div>

                <div className="description-content">
                  <div className="description-text">
                    {result.description}
                  </div>

                  <div className="description-stats">
                    <div className="stat">
                      <span className="stat-label">Words:</span>
                      <span className="stat-value">{result.wordCount}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Characters:</span>
                      <span className="stat-value">{result.characterCount}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Reading Time:</span>
                      <span className="stat-value">{Math.ceil(result.wordCount / 200)}min</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Platform Previews */}
              <div className="platform-previews">
                <h4>How it appears on each platform:</h4>

                {Object.entries(PLATFORM_SHARING).map(([platformKey, platform]) => (
                  <div key={platformKey} className="platform-preview-card">
                    <div className="preview-header">
                      <div className="platform-info">
                        <div className="platform-icon" style={{ backgroundColor: platform.color }}>
                          {platform.icon}
                        </div>
                        <div className="platform-details">
                          <h5>{platform.name}</h5>
                          <p>{platform.description}</p>
                        </div>
                      </div>
                      <button
                        className="btn-primary"
                        onClick={() => handleCopyToClipboard(getPlatformOptimizedVersion(platformKey as any), platformKey)}
                      >
                        {copiedText === platformKey ? '✅ Copied!' : '📋 Copy'}
                      </button>
                    </div>

                    <div className="platform-content">
                      <div className="preview-text">
                        {getPlatformOptimizedVersion(platformKey as any)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Share Tab */}
          {activeTab === 'share' && (
            <div className="share-tab">
              <div className="share-options">
                <h3>Share Your Description</h3>
                <p>Choose how you'd like to share your generated property description</p>

                {/* Direct Platform Sharing */}
                <div className="direct-sharing">
                  <h4>Share Directly</h4>
                  <div className="platform-share-buttons">
                    {Object.entries(PLATFORM_SHARING).map(([platformKey, platform]) => (
                      <button
                        key={platformKey}
                        className="platform-share-btn"
                        style={{ borderColor: platform.color }}
                        onClick={() => handlePlatformShare(platformKey as any)}
                      >
                        <div className="btn-icon" style={{ backgroundColor: platform.color }}>
                          {platform.icon}
                        </div>
                        <div className="btn-content">
                          <span className="btn-title">{platform.shareText}</span>
                          <span className="btn-description">{platform.description}</span>
                        </div>
                        <div className="btn-arrow">→</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Copy & Paste Options */}
                <div className="copy-sharing">
                  <h4>Copy & Paste</h4>
                  <div className="copy-options">
                    {Object.entries(PLATFORM_SHARING).map(([platformKey, platform]) => (
                      <div key={platformKey} className="copy-option">
                        <div className="copy-header">
                          <div className="copy-icon" style={{ backgroundColor: platform.color }}>
                            {platform.icon}
                          </div>
                          <div className="copy-info">
                            <h5>{platform.name} Format</h5>
                            <p>Optimized for {platform.name} posting</p>
                          </div>
                        </div>
                        <button
                          className="copy-btn"
                          onClick={() => handleCopyToClipboard(getPlatformOptimizedVersion(platformKey as any), platformKey)}
                        >
                          {copiedText === platformKey ? '✅ Copied!' : '📋 Copy'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Social Media Templates */}
                <div className="social-templates">
                  <h4>Quick Templates</h4>
                  <div className="template-buttons">
                    <button className="template-btn">
                      📱 Instagram Post
                    </button>
                    <button className="template-btn">
                      🐦 Twitter Post
                    </button>
                    <button className="template-btn">
                      💼 LinkedIn Post
                    </button>
                    <button className="template-btn">
                      📧 Email Template
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="export-tab">
              <div className="export-options">
                <h3>Export Options</h3>
                <p>Download your description in various formats for offline use</p>

                <div className="export-formats">
                  <button className="export-btn pdf" onClick={() => handleExport('pdf')}>
                    <div className="export-icon">📄</div>
                    <div className="export-content">
                      <h4>PDF Document</h4>
                      <p>Professional PDF with formatting</p>
                      <span className="export-size">~50KB</span>
                    </div>
                    <div className="export-arrow">⬇️</div>
                  </button>

                  <button className="export-btn docx" onClick={() => handleExport('docx')}>
                    <div className="export-icon">📝</div>
                    <div className="export-content">
                      <h4>Word Document</h4>
                      <p>Editable Microsoft Word format</p>
                      <span className="export-size">~25KB</span>
                    </div>
                    <div className="export-arrow">⬇️</div>
                  </button>

                  <button className="export-btn txt" onClick={() => handleExport('txt')}>
                    <div className="export-icon">📃</div>
                    <div className="export-content">
                      <h4>Plain Text</h4>
                      <p>Simple text file format</p>
                      <span className="export-size">~2KB</span>
                    </div>
                    <div className="export-arrow">⬇️</div>
                  </button>
                </div>

                {/* Save to History */}
                <div className="save-section">
                  <h4>Save for Later</h4>
                  <p>Keep this description in your history for future reference</p>
                  <button className="btn-primary save-btn" onClick={handleSaveToHistory}>
                    💾 Save to History
                  </button>
                </div>

                {/* Bulk Operations */}
                <div className="bulk-operations">
                  <h4>Bulk Operations</h4>
                  <div className="bulk-buttons">
                    <button className="bulk-btn">
                      📋 Copy All Formats
                    </button>
                    <button className="bulk-btn">
                      📤 Share to All Platforms
                    </button>
                    <button className="bulk-btn">
                      🗂️ Export All Formats
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="results-actions">
          <button className="btn-outline" onClick={onNewGeneration}>
            ← Generate New Description
          </button>
          <button className="btn-primary">
            View All Saved Descriptions
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsSharingInterface;