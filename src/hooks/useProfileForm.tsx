import { useState, useCallback, useEffect } from 'react';

interface ProfileFormData {
  full_name: string;
  company_name: string;
  linkedin_personal_url: string;
  linkedin_company_url: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function useProfileForm(initialData?: ProfileFormData) {
  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: '',
    company_name: '',
    linkedin_personal_url: '',
    linkedin_company_url: ''
  });

  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Update form data when initial data changes
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const updateField = useCallback((field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const updatePasswordField = useCallback((field: keyof PasswordFormData, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const clearPasswordForm = useCallback(() => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  }, []);

  const resetForm = useCallback((data?: ProfileFormData) => {
    if (data) {
      setFormData(data);
    } else {
      setFormData({
        full_name: '',
        company_name: '',
        linkedin_personal_url: '',
        linkedin_company_url: ''
      });
    }
  }, []);

  return {
    formData,
    passwordData,
    updateField,
    updatePasswordField,
    clearPasswordForm,
    resetForm
  };
}