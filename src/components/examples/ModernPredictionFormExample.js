import React, { useState } from 'react';
import { Upload, Sparkles, FileText, User, Mail, Phone, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Input, Select } from '../ui/Input';
import FileUpload from '../ui/FileUpload';
import Badge from '../ui/Badge';

/**
 * MODERN PREDICTION FORM - Example Template
 * 
 * This is a starter template showing how to modernize the PredictionForm
 * Copy patterns from here to update your actual PredictionForm.js
 */

const ModernPredictionFormExample = () => {
  const [resumeFile, setResumeFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    university: '',
    degree: '',
    cgpa: '',
    domain: ''
  });

  // Handle resume file upload and parsing
  const handleResumeUpload = async (file) => {
    setResumeFile(file);
    setIsParsing(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Get the API base URL from window location
      const API_BASE = `${window.location.protocol}//${window.location.hostname}:5000`;
      
      const response = await fetch(`${API_BASE}/api/parse-resume`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        
        // Autofill form with parsed data
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          university: data.university || data.bachelorUniversity || '',
          degree: data.degree || data.bachelorDegree || '',
          cgpa: data.cgpa || data.bachelorCGPA || '',
          domain: formData.domain // Keep selected domain
        });

        toast.success('Resume parsed successfully! Form auto-filled.');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to parse resume');
      }
    } catch (error) {
      console.error('Resume parsing error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setIsParsing(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.domain) {
      toast.error('Please fill in all required fields');
      return;
    }

    const loadingToast = toast.loading('Generating prediction...');

    try {
      // API call to predict
      const API_BASE = `${window.location.protocol}//${window.location.hostname}:5000`;
      const response = await fetch(`${API_BASE}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Prediction generated!', { id: loadingToast });
        // Navigate to results or show results
        console.log('Prediction result:', result);
      } else {
        toast.error('Prediction failed', { id: loadingToast });
      }
    } catch (error) {
      toast.error('Network error', { id: loadingToast });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full mb-4">
            <Sparkles size={16} />
            <span className="text-sm font-medium">AI-Powered Prediction</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Get Your Placement Prediction
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your resume for instant auto-fill or fill the form manually
          </p>
        </div>

        {/* Main Form Card */}
        <Card glow className="animate-slide-up">
          <CardHeader>
            <CardTitle>Your Information</CardTitle>
            <CardDescription>
              All fields marked with <Badge variant="error" size="sm">*</Badge> are required
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Resume Upload Section */}
              <div className="p-6 bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl border border-primary-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center">
                    <Upload className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Upload Resume (Optional)</h3>
                    <p className="text-sm text-gray-600">Auto-fill your details instantly</p>
                  </div>
                </div>
                
                <FileUpload
                  accept=".pdf,.doc,.docx,.txt"
                  maxSize={10}
                  file={resumeFile}
                  onFileSelect={handleResumeUpload}
                  onRemove={() => setResumeFile(null)}
                />
                
                {isParsing && (
                  <div className="mt-4 flex items-center gap-2 text-primary-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent"></div>
                    <span className="text-sm font-medium">Parsing resume...</span>
                  </div>
                )}
              </div>

              {/* Personal Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <User className="text-primary-600" size={20} />
                  Personal Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Full Name"
                    placeholder="John Doe"
                    required
                    leftIcon={<User size={18} />}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  
                  <Input
                    type="email"
                    label="Email Address"
                    placeholder="john@example.com"
                    required
                    leftIcon={<Mail size={18} />}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  
                  <Input
                    type="tel"
                    label="Phone Number"
                    placeholder="+1 234 567 8900"
                    leftIcon={<Phone size={18} />}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                  
                  <Select
                    label="Select Domain"
                    required
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  >
                    <option value="">Choose your domain...</option>
                    <option value="web">Web Development</option>
                    <option value="mobile">Mobile Development</option>
                    <option value="ai-ml">AI & Machine Learning</option>
                    <option value="cloud">Cloud & DevOps</option>
                    <option value="data">Data Science</option>
                    <option value="cyber">Cybersecurity</option>
                  </Select>
                </div>
              </div>

              {/* Academic Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <GraduationCap className="text-primary-600" size={20} />
                  Academic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="University"
                    placeholder="Your University Name"
                    value={formData.university}
                    onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                  />
                  
                  <Input
                    label="Degree"
                    placeholder="B.Tech in Computer Science"
                    value={formData.degree}
                    onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                  />
                  
                  <Input
                    type="number"
                    step="0.01"
                    label="CGPA"
                    placeholder="8.5"
                    value={formData.cgpa}
                    onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                    helperText="On a scale of 10"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  leftIcon={<Sparkles size={18} />}
                  className="flex-1"
                >
                  Generate Prediction
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setFormData({
                      name: '',
                      email: '',
                      phone: '',
                      university: '',
                      degree: '',
                      cgpa: '',
                      domain: ''
                    });
                    setResumeFile(null);
                    toast.success('Form reset');
                  }}
                >
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card hover className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="text-primary-600" size={24} />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">AI-Powered</h4>
              <p className="text-sm text-gray-600">Advanced ML algorithms analyze your profile</p>
            </CardContent>
          </Card>
          
          <Card hover className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="text-success-600" size={24} />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Auto-Fill</h4>
              <p className="text-sm text-gray-600">Upload resume to fill form instantly</p>
            </CardContent>
          </Card>
          
          <Card hover className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="text-purple-600" size={24} />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Accurate</h4>
              <p className="text-sm text-gray-600">Get precise placement probability scores</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ModernPredictionFormExample;
