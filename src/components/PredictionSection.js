import React, { useState, useEffect, useCallback, useRef } from 'react';
import { educationBackgrounds, getCompatibleDomains } from '../data/educationData';
import { jobDomains, getDomainById } from '../data/jobDomainData';

const PredictionSection = ({ onSelectionChange, initialEducation = '', initialDomain = '', initialRole = '', className = "" }) => {
  const [selectedEducation, setSelectedEducation] = useState(initialEducation);
  const [selectedDomain, setSelectedDomain] = useState(initialDomain);
  const [selectedRole, setSelectedRole] = useState(initialRole);
  
  // Initialize arrays synchronously based on initial props
  const getInitialDomains = () => {
    if (initialEducation) {
      const compatibleDomains = getCompatibleDomains(initialEducation);
      return jobDomains.filter(domain => compatibleDomains.includes(domain.id));
    }
    return [];
  };
  
  const getInitialRoles = () => {
    if (initialDomain) {
      const domain = getDomainById(initialDomain);
      return domain ? domain.roles : [];
    }
    return [];
  };
  
  const [availableDomains, setAvailableDomains] = useState(getInitialDomains());
  const [availableRoles, setAvailableRoles] = useState(getInitialRoles());
  const [errors, setErrors] = useState({});
  const [isRestoring, setIsRestoring] = useState(true);
  const isInitialMount = useRef(true);
  const hasRestoredRef = useRef(false);

  // Initialize with saved values on mount
  useEffect(() => {
    if (initialEducation || initialDomain || initialRole) {
      console.log('🔄 Restoring career prediction selections:', {
        education: initialEducation,
        domain: initialDomain,
        role: initialRole,
        domainsCount: availableDomains.length,
        rolesCount: availableRoles.length
      });
      
      console.log('📊 Available domains:', availableDomains.map(d => d.id));
      console.log('📊 Available roles:', availableRoles.map(r => r.id));
      console.log('🎯 Selected state:', {
        selectedEducation,
        selectedDomain,
        selectedRole
      });

      hasRestoredRef.current = true;

      // Allow time for state to settle, then disable restoring flag
      setTimeout(() => {
        setIsRestoring(false);
        isInitialMount.current = false;
        console.log('✅ Restoration complete - dropdowns should show:', {
          education: selectedEducation,
          domain: selectedDomain,
          role: selectedRole
        });
      }, 200);
    } else {
      setIsRestoring(false);
      isInitialMount.current = false;
    }
  }, []); // Run only once on mount

  // Reset dependent dropdowns when education changes (but not during restoration)
  useEffect(() => {
    if (isRestoring || hasRestoredRef.current) {
      console.log('⏸️ Skipping education effect - restoring:', isRestoring, 'hasRestored:', hasRestoredRef.current);
      if (hasRestoredRef.current && !isRestoring) {
        // Clear the flag after first render cycle completes
        hasRestoredRef.current = false;
      }
      return;
    }
    
    if (selectedEducation) {
      console.log('🔄 Education changed:', selectedEducation, '(initial:', initialEducation, ')');
      const compatibleDomains = getCompatibleDomains(selectedEducation);
      const domains = jobDomains.filter(domain => compatibleDomains.includes(domain.id));
      setAvailableDomains(domains);
      
      // Only reset if user is making a NEW selection (not initial value)
      if (selectedEducation !== initialEducation) {
        console.log('🗑️ Resetting domain/role due to new education selection');
        setSelectedDomain('');
        setSelectedRole('');
        setAvailableRoles([]);
      }
    } else {
      setAvailableDomains([]);
      setSelectedDomain('');
      setSelectedRole('');
      setAvailableRoles([]);
    }
  }, [selectedEducation, isRestoring, initialEducation]);

  // Reset roles when domain changes (but not during restoration)
  useEffect(() => {
    if (isRestoring || hasRestoredRef.current) {
      console.log('⏸️ Skipping domain effect - restoring:', isRestoring, 'hasRestored:', hasRestoredRef.current);
      return;
    }
    
    if (selectedDomain) {
      console.log('🔄 Domain changed:', selectedDomain, '(initial:', initialDomain, ')');
      const domain = getDomainById(selectedDomain);
      setAvailableRoles(domain ? domain.roles : []);
      
      // Only reset if user is making a NEW selection (not initial value)
      if (selectedDomain !== initialDomain) {
        console.log('🗑️ Resetting role due to new domain selection');
        setSelectedRole('');
      }
    } else {
      setAvailableRoles([]);
      setSelectedRole('');
    }
  }, [selectedDomain, isRestoring, initialDomain]);

  // Notify parent component of selection changes
  useEffect(() => {
    if (!isInitialMount.current && onSelectionChange) {
      onSelectionChange({
        education: selectedEducation,
        domain: selectedDomain,
        role: selectedRole,
        educationName: educationBackgrounds.find(edu => edu.id === selectedEducation)?.name || '',
        domainName: getDomainById(selectedDomain)?.name || '',
        roleName: getDomainById(selectedDomain)?.roles.find(role => role.id === selectedRole)?.name || '',
        roleData: getDomainById(selectedDomain)?.roles.find(role => role.id === selectedRole) || null
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEducation, selectedDomain, selectedRole]);

  const handleEducationChange = (e) => {
    const value = e.target.value;
    setSelectedEducation(value);
    setErrors(prev => ({ ...prev, education: '' }));
  };

  const handleDomainChange = (e) => {
    const value = e.target.value;
    setSelectedDomain(value);
    setErrors(prev => ({ ...prev, domain: '' }));
  };

  const handleRoleChange = (e) => {
    const value = e.target.value;
    setSelectedRole(value);
    setErrors(prev => ({ ...prev, role: '' }));
  };

  const validateSelection = () => {
    const newErrors = {};
    
    if (!selectedEducation) {
      newErrors.education = 'Please select your education background';
    }
    if (!selectedDomain) {
      newErrors.domain = 'Please select a job domain';
    }
    if (!selectedRole) {
      newErrors.role = 'Please select a job role';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getSelectedRoleSkills = () => {
    if (selectedDomain && selectedRole) {
      const domain = getDomainById(selectedDomain);
      const role = domain?.roles.find(r => r.id === selectedRole);
      return role?.skills || [];
    }
    return [];
  };

  return (
    <div className={`bg-white dark:bg-[#1e1a2e] rounded-lg shadow-lg dark:shadow-glow p-6 ${className}`}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Career Prediction</h2>
        <p className="text-gray-600 dark:text-gray-300">Select your education background and desired career path</p>
      </div>

      <div className="space-y-6">
        {/* Education Background Dropdown */}
        <div>
          <label htmlFor="education" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Education Background <span className="text-red-500 dark:text-red-400">*</span>
          </label>
          <select
            id="education"
            value={selectedEducation}
            onChange={handleEducationChange}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
              errors.education ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            <option value="">-- Select Education Background --</option>
            {educationBackgrounds.map(edu => (
              <option key={edu.id} value={edu.id}>
                {edu.name}
              </option>
            ))}
          </select>
          {errors.education && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.education}</p>
          )}
        </div>

        {/* Job Domain Dropdown */}
        <div>
          <label htmlFor="domain" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Job Domain <span className="text-red-500 dark:text-red-400">*</span>
          </label>
          <select
            id="domain"
            value={selectedDomain}
            onChange={handleDomainChange}
            disabled={!selectedEducation}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors text-gray-900 dark:text-gray-100 ${
              errors.domain ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
            } ${!selectedEducation ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : 'bg-white dark:bg-gray-700'}`}
          >
            <option value="">-- Select Job Domain --</option>
            {availableDomains.map(domain => (
              <option key={domain.id} value={domain.id}>
                {domain.name}
              </option>
            ))}
          </select>
          {errors.domain && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.domain}</p>
          )}
          {!selectedEducation && (
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Please select education background first</p>
          )}
        </div>

        {/* Job Role Dropdown */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Job Role (Subcategory) <span className="text-red-500 dark:text-red-400">*</span>
          </label>
          <select
            id="role"
            value={selectedRole}
            onChange={handleRoleChange}
            disabled={!selectedDomain}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors text-gray-900 dark:text-gray-100 ${
              errors.role ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
            } ${!selectedDomain ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : 'bg-white dark:bg-gray-700'}`}
          >
            <option value="">-- Select Job Role --</option>
            {availableRoles.map(role => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          {errors.role && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.role}</p>
          )}
          {!selectedDomain && (
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Please select job domain first</p>
          )}
        </div>

  {/* Removed Selected Role Information and action buttons as requested */}
      </div>
    </div>
  );
};

export default PredictionSection;
