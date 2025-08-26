import { useState, useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';

interface PostFormData {
  topic: string;
  keywords: string;
  customInstructions: string;
  tone: string;
  postFormat: string;
  includeHashtags: boolean;
  includeEmojis: boolean;
}

export function usePostGeneratorForm() {
  const [formData, setFormData] = useLocalStorage<PostFormData>('post_generator_form', {
    topic: '',
    keywords: '',
    customInstructions: '',
    tone: 'professional',
    postFormat: 'standard',
    includeHashtags: true,
    includeEmojis: false
  });

  const updateField = useCallback((field: keyof PostFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, [setFormData]);

  const clearForm = useCallback(() => {
    setFormData({
      topic: '',
      keywords: '',
      customInstructions: '',
      tone: 'professional',
      postFormat: 'standard',
      includeHashtags: true,
      includeEmojis: false
    });
  }, [setFormData]);

  const isFormValid = useMemo(() => {
    return formData.topic.trim().length > 0;
  }, [formData.topic]);

  return {
    formData,
    updateField,
    clearForm,
    isFormValid
  };
}