// Utility functions for domain ID to name mapping
import { getDomainById } from '../data/jobDomainData';

/**
 * Convert domain ID to display name using jobDomainData
 * @param {string} domainId - The domain ID (e.g., 'data_analytics')
 * @returns {string} - The display name (e.g., 'Data & Analytics')
 */
export const getDomainDisplayName = (domainId) => {
  if (!domainId) return '';
  
  const domain = getDomainById(domainId);
  return domain ? domain.name : domainId;
};

/**
 * Convert role ID to display name using jobDomainData
 * @param {string} domainId - The domain ID
 * @param {string} roleId - The role ID
 * @returns {string} - The role display name
 */
export const getRoleDisplayName = (domainId, roleId) => {
  if (!domainId || !roleId) return '';
  
  const domain = getDomainById(domainId);
  if (!domain) return roleId;
  
  const role = domain.roles.find(r => r.id === roleId);
  return role ? role.name : roleId;
};

/**
 * Get all available domains for dropdown display
 * @returns {Array} - Array of domain objects with id and name
 */
export const getAllDomainsForDisplay = () => {
  const { jobDomains } = require('../data/jobDomainData');
  return jobDomains.map(domain => ({
    id: domain.id,
    name: domain.name
  }));
};

/**
 * Validate if a domain ID exists
 * @param {string} domainId - The domain ID to validate
 * @returns {boolean} - True if domain exists
 */
export const isValidDomainId = (domainId) => {
  return !!getDomainById(domainId);
};