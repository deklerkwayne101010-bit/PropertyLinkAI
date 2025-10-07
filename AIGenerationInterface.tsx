import React, { useState, useEffect } from 'react';
import './design-system.css';
import './AIGenerationInterface.css';
import './AIGenerationInterface.css';

// Types for AI generation
export interface GenerationOptions {
  platform: 'property24' | 'facebook' | 'whatsapp';
  tone: 'professional' | 'enthusiastic' | 'luxury' | 'friendly' | 'formal';
  length: 'short' | 'medium' | 'long' | 'detailed';
  includePrice: boolean;
  includeFeatures: boolean;
  includeLocation: boolean;
  language: 'english' | 'afrikaans';
  targetAudience: 'first-time-buyers' | 'investors' | 'families' | 'professionals' | 'retirees';
}

export interface PropertyData {
  location: string;
  size: number;
  bedrooms: number;
  bathrooms: number;
  price: number;
  keyFeatures: string[];
  propertyType: string;
  yearBuilt?: number;
  parking?: number;
  petsAllowed?: boolean;
}

interface AIGenerationInterfaceProps {
  propertyData?: PropertyData;
  generationOptions?: GenerationOptions;
  onGenerate?: (data: PropertyData, options: GenerationOptions) => void;
  onEdit?: () => void;
  isGenerating?: boolean;
  generatedDescription?: string;
  error?: string;
}

const AIGenerationInterface: React.FC<AIGenerationInterfaceProps> = ({
  propertyData,
  generationOptions,
  onGenerate,
  onEdit,
  isGenerating = false,
  generatedDescription,
  error
}) => {
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [showEditMode, setShowEditMode] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');

  // Generation steps for progress indication
  const generationSteps = [
    'Analyzing property details...',
    'Crafting perfect tone...',
    'Optimizing for platform...',
    'Adding local market insights...',
    'Finalizing description...'
  ];

  // Simulate generation progress
  useEffect(() => {
    if (isGenerating) {
      setGenerationProgress(0);
      setCurrentStep(generationSteps[0]);

      const interval = setInterval(() => {
        setGenerationProgress(prev => {
          const newProgress = prev + Math.random() * 15;

          if (newProgress >= 100) {
            setCurrentStep('Complete!');
            clearInterval(interval);
            return 100;
          }

          // Update current step based on progress
          const stepIndex = Math.floor((newProgress / 100) * generationSteps.length);
          if (stepIndex < generationSteps.length) {
            setCurrentStep(generationSteps[stepIndex]);
          }

          return newProgress;
        });
      }, 300);

      return () => clearInterval(interval);
    }
  }, [isGenerating]);

  // Handle generation
  const handleGenerate = () => {
    if (propertyData && generationOptions) {
      onGenerate?.(propertyData, generationOptions);
    }
  };

  // Handle edit mode
  const handleEditToggle = () => {
    setShowEditMode(!showEditMode);
    if (!showEditMode && generatedDescription) {
      setEditedDescription(generatedDescription);
    }
  };

  // Handle save edit
  const handleSaveEdit = () => {
    // In a real app, this would save to backend
    setShowEditMode(false);
    // Update the generated description with edited version
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditedDescription(generatedDescription || '');
    setShowEditMode(false);
  };

  const canGenerate = propertyData && generationOptions && !isGenerating;

  return (
    <div className="ai-generation-container">
      <div className="ai-generation-wrapper">
        {/* Header */}
        <div className="generation-header">
          <div className="header-content">
            <div className="header-icon">🤖</div>
            <div className="header-text">
              <h2 className="generation-title">AI Description Generator</h2>
              <p className="generation-subtitle">
                Create professional property descriptions in seconds using artificial intelligence
              </p>
            </div>
          </div>

          {/* Generation Stats */}
          {propertyData && generationOptions && (
            <div className="generation-stats">
              <div className="stat-item">
                <span className="stat-label">Platform:</span>
                <span className="stat-value">{generationOptions.platform}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Tone:</span>
                <span className="stat-value">{generationOptions.tone}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Length:</span>
                <span className="stat-value">{generationOptions.length}</span>
              </div>
            </div>
          )}
        </div>

        {/* Main Generation Area */}
        <div className="generation-main">
          {/* Generate Button Section */}
          {!generatedDescription && !isGenerating && (
            <div className="generate-section">
              <div className="generate-prompt">
                <h3>Ready to Generate?</h3>
                <p>Click the button below to create your AI-powered property description.</p>

                {propertyData && (
                  <div className="property-summary">
                    <h4>Property Summary:</h4>
                    <ul>
                      <li>📍 {propertyData.location}</li>
                      <li>🏠 {propertyData.bedrooms} bed • {propertyData.bathrooms} bath</li>
                      <li>📐 {propertyData.size}m² {propertyData.propertyType}</li>
                      <li>💰 R {propertyData.price.toLocaleString()}</li>
                      {propertyData.keyFeatures.length > 0 && (
                        <li>✨ {propertyData.keyFeatures.slice(0, 3).join(', ')}{propertyData.keyFeatures.length > 3 ? '...' : ''}</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              <button
                className="generate-btn"
                onClick={handleGenerate}
                disabled={!canGenerate}
              >
                <div className="btn-icon">⚡</div>
                <div className="btn-content">
                  <span className="btn-text">Generate AI Description</span>
                  <span className="btn-subtitle">Powered by advanced AI technology</span>
                </div>
                <div className="btn-arrow">→</div>
              </button>

              {!canGenerate && (
                <p className="generate-help">
                  Please complete your property details and select a platform to continue
                </p>
              )}
            </div>
          )}

          {/* Loading State */}
          {isGenerating && (
            <div className="loading-section">
              <div className="loading-animation">
                <div className="ai-brain">
                  <div className="brain-pulses">
                    <div className="pulse"></div>
                    <div className="pulse"></div>
                    <div className="pulse"></div>
                  </div>
                </div>

                <div className="loading-progress">
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                  <div className="progress-text">
                    <span className="progress-percentage">{Math.round(generationProgress)}%</span>
                    <span className="progress-step">{currentStep}</span>
                  </div>
                </div>
              </div>

              <div className="loading-tips">
                <h4>Generation Tips:</h4>
                <ul>
                  <li>✨ AI analyzes market trends for optimal wording</li>
                  <li>🎯 Tailored for your selected platform and audience</li>
                  <li>🌍 Includes local market insights</li>
                  <li>📱 Optimized for mobile viewing</li>
                </ul>
              </div>
            </div>
          )}

          {/* Generated Result */}
          {generatedDescription && !isGenerating && (
            <div className="result-section">
              <div className="result-header">
                <div className="result-success">
                  <div className="success-icon">✨</div>
                  <div className="success-text">
                    <h3>Description Generated!</h3>
                    <p>Your AI-powered property description is ready</p>
                  </div>
                </div>

                <div className="result-actions">
                  <button className="btn-secondary" onClick={onEdit}>
                    ← Edit Details
                  </button>
                  <button className="btn-outline" onClick={handleEditToggle}>
                    {showEditMode ? 'Cancel Edit' : '✏️ Edit'}
                  </button>
                </div>
              </div>

              {/* Generated Description Display */}
              <div className="description-display">
                {showEditMode ? (
                  <div className="edit-mode">
                    <textarea
                      className="edit-textarea"
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      placeholder="Edit your description..."
                    />
                    <div className="edit-actions">
                      <button className="btn-ghost" onClick={handleCancelEdit}>
                        Cancel
                      </button>
                      <button className="btn-primary" onClick={handleSaveEdit}>
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="description-content">
                    <div className="description-text">
                      {generatedDescription}
                    </div>

                    <div className="description-meta">
                      <div className="meta-item">
                        <span className="meta-label">Words:</span>
                        <span className="meta-value">{generatedDescription.split(' ').length}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Characters:</span>
                        <span className="meta-value">{generatedDescription.length}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Reading Time:</span>
                        <span className="meta-value">{Math.ceil(generatedDescription.split(' ').length / 200)}min</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="error-section">
              <div className="error-icon">⚠️</div>
              <div className="error-content">
                <h3>Generation Failed</h3>
                <p>{error}</p>
                <button className="btn-primary" onClick={handleGenerate}>
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions Sidebar */}
        {generatedDescription && !isGenerating && (
          <div className="quick-actions">
            <h4>Quick Actions</h4>
            <div className="action-buttons">
              <button className="action-btn copy">
                <span className="action-icon">📋</span>
                <span>Copy Text</span>
              </button>

              <button className="action-btn share">
                <span className="action-icon">📤</span>
                <span>Share</span>
              </button>

              <button className="action-btn save">
                <span className="action-icon">💾</span>
                <span>Save Draft</span>
              </button>

              <button className="action-btn regenerate">
                <span className="action-icon">🔄</span>
                <span>Regenerate</span>
              </button>
            </div>
          </div>
        )}

        {/* Generation History/Alternatives */}
        {generatedDescription && !isGenerating && (
          <div className="generation-history">
            <h4>Alternative Versions</h4>
            <p className="history-subtitle">
              Generate different versions for A/B testing
            </p>

            <div className="alternative-buttons">
              <button className="alt-btn">
                <span className="alt-tone">Professional</span>
                <span className="alt-desc">Formal tone</span>
              </button>

              <button className="alt-btn">
                <span className="alt-tone">Enthusiastic</span>
                <span className="alt-desc">Exciting tone</span>
              </button>

              <button className="alt-btn">
                <span className="alt-tone">Luxury</span>
                <span className="alt-desc">Premium tone</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIGenerationInterface;