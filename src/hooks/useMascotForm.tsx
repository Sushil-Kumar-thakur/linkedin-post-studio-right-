import { useState, useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';

interface MascotFormState {
  description: string;
  image: File | null;
  imagePreview: string | null;
}

export function useMascotForm() {
  const [formData, setFormData] = useLocalStorage('mascot_form_data', {
    description: ''
  });

  const [mascotImage, setMascotImage] = useState<File | null>(null);
  const [mascotImagePreview, setMascotImagePreview] = useState<string | null>(null);

  const updateDescription = useCallback((description: string) => {
    setFormData(prev => ({ ...prev, description }));
  }, [setFormData]);

  const handleImageUpload = useCallback((file: File) => {
    setMascotImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setMascotImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const clearForm = useCallback(() => {
    setFormData({ description: '' });
    setMascotImage(null);
    setMascotImagePreview(null);
  }, [setFormData]);

  const isFormValid = useMemo(() => {
    return mascotImage !== null && formData.description.trim().length > 0;
  }, [mascotImage, formData.description]);

  return {
    description: formData.description,
    mascotImage,
    mascotImagePreview,
    updateDescription,
    handleImageUpload,
    clearForm,
    isFormValid
  };
}