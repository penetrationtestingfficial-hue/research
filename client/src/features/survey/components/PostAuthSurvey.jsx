// client/src/features/survey/components/PostAuthSurvey.jsx
/**
 * Post-Authentication Survey Component
 * Captures qualitative user experience data after successful authentication
 * 
 * Research Purpose:
 * - Measure perceived usability (Likert scales)
 * - Capture qualitative feedback (open-ended)
 * - Identify pain points and friction
 * - Complement quantitative telemetry data
 */

import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';

const PostAuthSurvey = ({ authMethod, userId, onSubmit, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [startTime, setStartTime] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Survey responses
  const [ratings, setRatings] = useState({
    easeOfUse: 0,
    perceivedSecurity: 0,
    confidence: 0,
    willingnessToReuse: 0
  });

  const [feedback, setFeedback] = useState({
    positiveAspects: '',
    difficulties: '',
    improvements: '',
    overallExperience: ''
  });

  /**
   * Track survey start time for completion time metric
   */
  useEffect(() => {
    setStartTime(performance.now());
  }, []);

  /**
   * Handle rating change for Likert scale questions
   */
  const handleRatingChange = (question, value) => {
    setRatings(prev => ({
      ...prev,
      [question]: value
    }));
  };

  /**
   * Handle text input change
   */
  const handleFeedbackChange = (field, value) => {
    setFeedback(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Validate current step before proceeding
   */
  const validateStep = (step) => {
    if (step === 1) {
      // Check if all ratings are filled (not 0)
      const allRated = Object.values(ratings).every(rating => rating > 0);
      if (!allRated) {
        setError('Please answer all rating questions');
        return false;
      }
    }
    
    setError(null);
    return true;
  };

  /**
   * Move to next step
   */
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  /**
   * Move to previous step
   */
  const handleBack = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
    setError(null);
  };

  /**
   * Submit survey responses
   */
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Calculate completion time
    const completionTime = Math.round(performance.now() - startTime);

    try {
      const response = await api.post('/survey/submit', {
        user_id: userId,
        auth_method: authMethod,
        ease_of_use: ratings.easeOfUse,
        perceived_security: ratings.perceivedSecurity,
        confidence_level: ratings.confidence,
        willingness_to_reuse: ratings.willingnessToReuse,
        qualitative_feedback: JSON.stringify(feedback),
        completion_time_seconds: Math.round(completionTime / 1000)
      });

      if (response.data.success) {
        onSubmit(response.data);
      }
    } catch (err) {
      console.error('Survey submission error:', err);
      setError('Failed to submit survey. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Likert Scale Question Component
   */
  const LikertQuestion = ({ question, value, onChange, labels }) => (
    <div className="mb-6">
      <p className="text-sm font-medium text-gray-800 mb-3">{question}</p>
      
      <div className="flex items-center justify-between gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            onClick={() => onChange(rating)}
            className={`
              flex-1 py-3 px-2 rounded-lg border-2 transition-all
              ${value === rating
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400 text-gray-600'
              }
            `}
            type="button"
          >
            <div className="text-xl font-bold">{rating}</div>
            <div className="text-xs mt-1">{labels[rating - 1]}</div>
          </button>
        ))}
      </div>
    </div>
  );

  /**
   * Step 1: Likert Scale Ratings
   */
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          Your Experience
        </h3>
        <p className="text-sm text-gray-600">
          Please rate your experience with {authMethod === 'TRADITIONAL' ? 'password' : 'wallet'} login
        </p>
      </div>

      <LikertQuestion
        question="How easy was it to log in?"
        value={ratings.easeOfUse}
        onChange={(val) => handleRatingChange('easeOfUse', val)}
        labels={['Very Difficult', 'Difficult', 'Neutral', 'Easy', 'Very Easy']}
      />

      <LikertQuestion
        question="How secure do you feel this login method is?"
        value={ratings.perceivedSecurity}
        onChange={(val) => handleRatingChange('perceivedSecurity', val)}
        labels={['Not Secure', 'Somewhat Secure', 'Neutral', 'Secure', 'Very Secure']}
      />

      <LikertQuestion
        question="How confident are you that you could log in again successfully?"
        value={ratings.confidence}
        onChange={(val) => handleRatingChange('confidence', val)}
        labels={['Not Confident', 'Slightly', 'Neutral', 'Confident', 'Very Confident']}
      />

      <LikertQuestion
        question="Would you be willing to use this login method again?"
        value={ratings.willingnessToReuse}
        onChange={(val) => handleRatingChange('willingnessToReuse', val)}
        labels={['Definitely Not', 'Probably Not', 'Maybe', 'Probably', 'Definitely']}
      />
    </div>
  );

  /**
   * Step 2: Open-Ended Feedback
   */
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          Tell Us More
        </h3>
        <p className="text-sm text-gray-600">
          Your detailed feedback helps us improve the system
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What did you like about this login method?
        </label>
        <textarea
          value={feedback.positiveAspects}
          onChange={(e) => handleFeedbackChange('positiveAspects', e.target.value)}
          placeholder="Example: It was fast, no password to remember, felt secure..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows="3"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What difficulties or confusion did you experience?
        </label>
        <textarea
          value={feedback.difficulties}
          onChange={(e) => handleFeedbackChange('difficulties', e.target.value)}
          placeholder="Example: Wasn't sure what to click, popup was confusing..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows="3"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          How could this login experience be improved?
        </label>
        <textarea
          value={feedback.improvements}
          onChange={(e) => handleFeedbackChange('improvements', e.target.value)}
          placeholder="Your suggestions..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows="3"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Any other comments?
        </label>
        <textarea
          value={feedback.overallExperience}
          onChange={(e) => handleFeedbackChange('overallExperience', e.target.value)}
          placeholder="Share any additional thoughts..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows="3"
        />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Quick Survey</h2>
              <p className="text-sm text-gray-600 mt-1">
                Step {currentStep} of 2
              </p>
            </div>
            
            {/* Progress Bar */}
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${currentStep >= 1 ? 'bg-blue-500' : 'bg-gray-300'}`} />
              <div className={`w-3 h-3 rounded-full ${currentStep >= 2 ? 'bg-blue-500' : 'bg-gray-300'}`} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Step Content */}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={onSkip}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            disabled={isSubmitting}
          >
            Skip Survey
          </button>

          <div className="flex gap-3">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                disabled={isSubmitting}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
            )}

            {currentStep < 2 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`
                  px-6 py-2 rounded-lg text-white
                  ${isSubmitting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                  }
                `}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  'Submit Survey'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostAuthSurvey;
