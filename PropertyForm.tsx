import React, { useState, useEffect } from 'react';
import './design-system.css';
import './PropertyForm.css';
import './PropertyForm.css';

// Types for our property form
export interface PropertyFormData {
  location: string;
  size: number; // in square meters
  bedrooms: number;
  bathrooms: number;
  price: number;
  keyFeatures: string[];
  propertyType: 'house' | 'apartment' | 'townhouse' | 'land';
  yearBuilt?: number;
  parking?: number;
  petsAllowed?: boolean;
}

interface PropertyFormProps {
  initialData?: Partial<PropertyFormData>;
  onSubmit?: (data: PropertyFormData) => void;
  onChange?: (data: PropertyFormData) => void;
  isLoading?: boolean;
}

// Predefined options for better UX
const PROPERTY_TYPES = [
  { value: 'house', label: 'House', icon: '🏠' },
  { value: 'apartment', label: 'Apartment', icon: '🏢' },
  { value: 'townhouse', label: 'Townhouse', icon: '🏘️' },
  { value: 'land', label: 'Land', icon: '🌳' }
] as const;

const COMMON_FEATURES = [
  'Garden', 'Swimming Pool', 'Garage', 'Balcony', 'Built-in Cupboards',
  'Air Conditioning', 'Security System', 'Fireplace', 'Study',
  'Laundry Room', 'Walk-in Closet', 'Pantry', 'Wine Cellar',
  'Home Office', 'Gym', 'Sauna', 'Jacuzzi', 'Solar Panels',
  'Borehole', 'Electric Fence', 'Alarm System', 'Intercom'
];

const PropertyForm: React.FC<PropertyFormProps> = ({
  initialData = {},
  onSubmit,
  onChange,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<PropertyFormData>({
    location: '',
    size: 0,
    bedrooms: 0,
    bathrooms: 0,
    price: 0,
    keyFeatures: [],
    propertyType: 'house',
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [customFeature, setCustomFeature] = useState('');
  const [showCustomFeatureInput, setShowCustomFeatureInput] = useState(false);

  // Form steps for progress indication
  const formSteps = [
    { id: 1, title: 'Property Type', fields: ['propertyType'] },
    { id: 2, title: 'Basic Details', fields: ['location', 'size', 'bedrooms', 'bathrooms'] },
    { id: 3, title: 'Price & Features', fields: ['price', 'keyFeatures'] }
  ];

  // Calculate form completion percentage
  const getCompletionPercentage = (): number => {
    const totalFields = Object.keys(formData).length;
    const completedFields = Object.values(formData).filter(value =>
      value !== '' && value !== 0 && value !== null && value !== undefined
    ).length;
    return Math.round((completedFields / totalFields) * 100);
  };

  // Validation functions
  const validateField = (field: keyof PropertyFormData, value: any): string => {
    switch (field) {
      case 'location':
        if (!value || value.trim().length < 3) {
          return 'Location must be at least 3 characters long';
        }
        break;
      case 'size':
        if (!value || value <= 0) {
          return 'Size must be greater than 0';
        }
        if (value > 10000) {
          return 'Size seems unusually large. Please verify.';
        }
        break;
      case 'bedrooms':
        if (!value || value < 0) {
          return 'Number of bedrooms must be 0 or more';
        }
        if (value > 20) {
          return 'Number of bedrooms seems high. Please verify.';
        }
        break;
      case 'bathrooms':
        if (!value || value <= 0) {
          return 'Number of bathrooms must be greater than 0';
        }
        if (value > 15) {
          return 'Number of bathrooms seems high. Please verify.';
        }
        break;
      case 'price':
        if (!value || value <= 0) {
          return 'Price must be greater than 0';
        }
        if (value > 50000000) { // 50 million
          return 'Price seems unusually high. Please verify.';
        }
        break;
      case 'yearBuilt':
        if (value && (value < 1800 || value > new Date().getFullYear())) {
          return 'Please enter a valid year';
        }
        break;
    }
    return '';
  };

  // Handle input changes with validation
  const handleInputChange = (field: keyof PropertyFormData, value: any) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    // Real-time validation
    const error = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));

    // Notify parent component
    onChange?.(newFormData);

    // Auto-advance to next step if current step is complete
    updateCurrentStep(newFormData);
  };

  // Update current step based on form completion
  const updateCurrentStep = (data: PropertyFormData) => {
    for (let i = formSteps.length; i > 0; i--) {
      const step = formSteps[i - 1];
      const stepComplete = step.fields.every(field => {
        const value = data[field as keyof PropertyFormData];
        return value !== '' && value !== 0 && value !== null && value !== undefined;
      });

      if (stepComplete) {
        setCurrentStep(step.id);
        break;
      }
    }
  };

  // Handle feature selection
  const toggleFeature = (feature: string) => {
    const newFeatures = formData.keyFeatures.includes(feature)
      ? formData.keyFeatures.filter(f => f !== feature)
      : [...formData.keyFeatures, feature];

    handleInputChange('keyFeatures', newFeatures);
  };

  // Handle custom feature addition
  const addCustomFeature = () => {
    if (customFeature.trim() && !formData.keyFeatures.includes(customFeature.trim())) {
      handleInputChange('keyFeatures', [...formData.keyFeatures, customFeature.trim()]);
      setCustomFeature('');
      setShowCustomFeatureInput(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: Record<string, string> = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key as keyof PropertyFormData, formData[key as keyof PropertyFormData]);
      if (error) newErrors[key] = error;
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSubmit?.(formData);
    }
  };

  // Auto-advance logic
  useEffect(() => {
    updateCurrentStep(formData);
  }, [formData]);

  return (
    <div className="property-form-container">
      <div className="property-form-wrapper">
        {/* Header */}
        <div className="form-header">
          <h2 className="form-title">Property Details</h2>
          <p className="form-subtitle">
            Tell us about your property to generate the perfect description
          </p>

          {/* Progress Indicator */}
          <div className="progress-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${getCompletionPercentage()}%` }}
              />
            </div>
            <div className="progress-text">
              {getCompletionPercentage()}% Complete
            </div>
          </div>

          {/* Step Indicators */}
          <div className="step-indicators">
            {formSteps.map((step, index) => (
              <div
                key={step.id}
                className={`step-indicator ${currentStep >= step.id ? 'active' : ''}`}
              >
                <div className="step-number">{step.id}</div>
                <div className="step-title">{step.title}</div>
              </div>
            ))}
          </div>
        </div>

        <form className="property-form" onSubmit={handleSubmit}>
          {/* Step 1: Property Type */}
          <div className={`form-step ${currentStep >= 1 ? 'active' : ''}`}>
            <div className="step-header">
              <h3 className="step-title">What type of property is this?</h3>
            </div>

            <div className="property-type-grid">
              {PROPERTY_TYPES.map(type => (
                <button
                  key={type.value}
                  type="button"
                  className={`property-type-card ${formData.propertyType === type.value ? 'selected' : ''}`}
                  onClick={() => handleInputChange('propertyType', type.value)}
                  disabled={isLoading}
                >
                  <div className="property-type-icon">{type.icon}</div>
                  <div className="property-type-label">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Basic Details */}
          <div className={`form-step ${currentStep >= 2 ? 'active' : ''}`}>
            <div className="step-header">
              <h3 className="step-title">Basic Information</h3>
              <p className="step-description">
                Essential details about your property
              </p>
            </div>

            <div className="form-grid">
              {/* Location */}
              <div className="form-group">
                <label htmlFor="location" className="form-label">
                  Location *
                </label>
                <input
                  id="location"
                  type="text"
                  className={`form-input ${errors.location ? 'error' : ''}`}
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="e.g., Sandton, Johannesburg"
                  disabled={isLoading}
                />
                {errors.location && (
                  <span className="form-error">{errors.location}</span>
                )}
              </div>

              {/* Size */}
              <div className="form-group">
                <label htmlFor="size" className="form-label">
                  Size (m²) *
                </label>
                <input
                  id="size"
                  type="number"
                  className={`form-input ${errors.size ? 'error' : ''}`}
                  value={formData.size || ''}
                  onChange={(e) => handleInputChange('size', parseInt(e.target.value) || 0)}
                  placeholder="e.g., 150"
                  min="1"
                  max="10000"
                  disabled={isLoading}
                />
                {errors.size && (
                  <span className="form-error">{errors.size}</span>
                )}
              </div>

              {/* Bedrooms */}
              <div className="form-group">
                <label htmlFor="bedrooms" className="form-label">
                  Bedrooms *
                </label>
                <input
                  id="bedrooms"
                  type="number"
                  className={`form-input ${errors.bedrooms ? 'error' : ''}`}
                  value={formData.bedrooms || ''}
                  onChange={(e) => handleInputChange('bedrooms', parseInt(e.target.value) || 0)}
                  placeholder="e.g., 3"
                  min="0"
                  max="20"
                  disabled={isLoading}
                />
                {errors.bedrooms && (
                  <span className="form-error">{errors.bedrooms}</span>
                )}
              </div>

              {/* Bathrooms */}
              <div className="form-group">
                <label htmlFor="bathrooms" className="form-label">
                  Bathrooms *
                </label>
                <input
                  id="bathrooms"
                  type="number"
                  className={`form-input ${errors.bathrooms ? 'error' : ''}`}
                  value={formData.bathrooms || ''}
                  onChange={(e) => handleInputChange('bathrooms', parseFloat(e.target.value) || 0)}
                  placeholder="e.g., 2.5"
                  min="0"
                  max="15"
                  step="0.5"
                  disabled={isLoading}
                />
                {errors.bathrooms && (
                  <span className="form-error">{errors.bathrooms}</span>
                )}
              </div>
            </div>
          </div>

          {/* Step 3: Price & Features */}
          <div className={`form-step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-header">
              <h3 className="step-title">Price & Features</h3>
              <p className="step-description">
                Set your price and highlight key features
              </p>
            </div>

            {/* Price */}
            <div className="form-group price-group">
              <label htmlFor="price" className="form-label">
                Price (R) *
              </label>
              <div className="price-input-wrapper">
                <span className="price-currency">R</span>
                <input
                  id="price"
                  type="number"
                  className={`form-input price-input ${errors.price ? 'error' : ''}`}
                  value={formData.price || ''}
                  onChange={(e) => handleInputChange('price', parseInt(e.target.value) || 0)}
                  placeholder="2,500,000"
                  min="1"
                  max="50000000"
                  disabled={isLoading}
                />
              </div>
              {errors.price && (
                <span className="form-error">{errors.price}</span>
              )}
            </div>

            {/* Key Features */}
            <div className="form-group">
              <label className="form-label">
                Key Features
              </label>
              <div className="features-grid">
                {COMMON_FEATURES.map(feature => (
                  <button
                    key={feature}
                    type="button"
                    className={`feature-tag ${formData.keyFeatures.includes(feature) ? 'selected' : ''}`}
                    onClick={() => toggleFeature(feature)}
                    disabled={isLoading}
                  >
                    {feature}
                  </button>
                ))}
              </div>

              {/* Custom Feature Input */}
              {showCustomFeatureInput ? (
                <div className="custom-feature-input">
                  <input
                    type="text"
                    className="form-input"
                    value={customFeature}
                    onChange={(e) => setCustomFeature(e.target.value)}
                    placeholder="Enter custom feature..."
                    onKeyPress={(e) => e.key === 'Enter' && addCustomFeature()}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={addCustomFeature}
                    disabled={!customFeature.trim()}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setShowCustomFeatureInput(false)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setShowCustomFeatureInput(true)}
                  disabled={isLoading}
                >
                  + Add Custom Feature
                </button>
              )}

              {/* Selected Features Display */}
              {formData.keyFeatures.length > 0 && (
                <div className="selected-features">
                  <div className="selected-features-label">Selected Features:</div>
                  <div className="selected-features-list">
                    {formData.keyFeatures.map(feature => (
                      <span key={feature} className="selected-feature">
                        {feature}
                        <button
                          type="button"
                          className="remove-feature"
                          onClick={() => toggleFeature(feature)}
                          disabled={isLoading}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary form-submit-btn"
              disabled={isLoading || getCompletionPercentage() < 80}
            >
              {isLoading ? 'Generating Description...' : 'Generate AI Description'}
            </button>

            {getCompletionPercentage() < 80 && (
              <p className="form-help">
                Please complete the required fields (*) to continue
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default PropertyForm;