import React, { useState } from 'react';
import { Sparkles, Zap, Heart, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Input, TextArea, Select } from '../ui/Input';
import FileUpload from '../ui/FileUpload';
import Badge from '../ui/Badge';

/**
 * COMPONENT SHOWCASE
 * 
 * This page demonstrates all the modern UI components
 * Navigate to /component-showcase to see them in action
 * 
 * Add this route to App.js:
 * import ComponentShowcase from './components/examples/ComponentShowcase';
 * <Route path="/component-showcase" element={<ComponentShowcase />} />
 */

const ComponentShowcase = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const showToasts = () => {
    toast.success('Success toast!');
    setTimeout(() => toast.error('Error toast!'), 500);
    setTimeout(() => toast.loading('Loading toast!'), 1000);
    setTimeout(() => toast('Custom toast!', { icon: '🎉' }), 1500);
  };

  const simulateLoading = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center animate-fade-in">
          <Badge variant="primary" className="mb-4">
            Modern UI Components
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Component Showcase
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            All the beautiful, reusable components ready for your placement prediction system
          </p>
        </div>

        {/* Buttons Section */}
        <Card glow className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>All button variants with icons and loading states</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Variants</h4>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="success">Success</Button>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Sizes</h4>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon" variant="primary">
                  <Sparkles size={18} />
                </Button>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">With Icons</h4>
              <div className="flex flex-wrap gap-3">
                <Button leftIcon={<Sparkles size={18} />}>Left Icon</Button>
                <Button rightIcon={<Zap size={18} />} variant="secondary">Right Icon</Button>
                <Button leftIcon={<Heart size={18} />} variant="outline">Both Sides</Button>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">States</h4>
              <div className="flex flex-wrap gap-3">
                <Button isLoading={loading} onClick={simulateLoading}>
                  {loading ? 'Loading...' : 'Click to Load'}
                </Button>
                <Button disabled>Disabled</Button>
                <Button variant="success" leftIcon={<Check size={18} />}>Enabled</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card hover className="animate-slide-up" style={{ animationDelay: '200ms' }}>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center mb-4">
                <Sparkles className="text-primary-600" size={24} />
              </div>
              <CardTitle>Hover Effect</CardTitle>
              <CardDescription>Hover over me to see the lift effect</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">This card has hover lift animation and shadow transitions.</p>
            </CardContent>
          </Card>

          <Card glow className="animate-slide-up" style={{ animationDelay: '300ms' }}>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-success-100 flex items-center justify-center mb-4">
                <Zap className="text-success-600" size={24} />
              </div>
              <CardTitle>Glow Shadow</CardTitle>
              <CardDescription>This card has a soft glow shadow</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Perfect for highlighting important content.</p>
            </CardContent>
          </Card>

          <Card hover glow className="animate-slide-up" style={{ animationDelay: '400ms' }}>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                <Heart className="text-purple-600" size={24} />
              </div>
              <CardTitle>Combined</CardTitle>
              <CardDescription>Both hover and glow effects</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="outline" size="sm">Action</Button>
            </CardFooter>
          </Card>
        </div>

        {/* Form Inputs Section */}
        <Card glow className="animate-slide-up" style={{ animationDelay: '500ms' }}>
          <CardHeader>
            <CardTitle>Form Inputs</CardTitle>
            <CardDescription>All input variants with validation states</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Default Input"
                placeholder="Enter text here..."
              />
              
              <Input 
                label="With Icon"
                placeholder="Search..."
                leftIcon={<Sparkles size={18} />}
              />
              
              <Input 
                label="Required Field"
                placeholder="Must fill this"
                required
                helperText="This field is required"
              />
              
              <Input 
                label="Error State"
                placeholder="Invalid input"
                error="This field has an error"
              />
              
              <Input 
                type="email"
                label="Email Input"
                placeholder="you@example.com"
              />
              
              <Input 
                type="number"
                label="Number Input"
                placeholder="123"
              />
            </div>
            
            <Select label="Select Dropdown" required>
              <option value="">Choose an option...</option>
              <option value="1">Option 1</option>
              <option value="2">Option 2</option>
              <option value="3">Option 3</option>
            </Select>
            
            <TextArea 
              label="Text Area"
              placeholder="Enter multiple lines of text..."
              rows={4}
              helperText="You can write as much as you want here"
            />
          </CardContent>
        </Card>

        {/* Badges Section */}
        <Card glow className="animate-slide-up" style={{ animationDelay: '600ms' }}>
          <CardHeader>
            <CardTitle>Badges</CardTitle>
            <CardDescription>Status indicators and labels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Variants</h4>
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="primary">Primary</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="error">Error</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Sizes</h4>
              <div className="flex flex-wrap items-center gap-2">
                <Badge size="sm">Small</Badge>
                <Badge size="default">Default</Badge>
                <Badge size="lg">Large</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Upload Section */}
        <Card glow className="animate-slide-up" style={{ animationDelay: '700ms' }}>
          <CardHeader>
            <CardTitle>File Upload</CardTitle>
            <CardDescription>Drag & drop file upload with validation</CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload
              accept=".pdf,.doc,.docx"
              maxSize={10}
              file={file}
              onFileSelect={setFile}
              onRemove={() => setFile(null)}
            />
          </CardContent>
        </Card>

        {/* Toasts Section */}
        <Card glow className="animate-slide-up" style={{ animationDelay: '800ms' }}>
          <CardHeader>
            <CardTitle>Toast Notifications</CardTitle>
            <CardDescription>Beautiful notifications for user feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={showToasts} leftIcon={<Sparkles size={18} />}>
              Show All Toast Types
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8 animate-fade-in">
          <p className="text-gray-600 mb-4">
            All components are production-ready and fully customizable
          </p>
          <div className="flex justify-center gap-3">
            <Badge variant="success">
              <Check size={14} className="mr-1" />
              Responsive
            </Badge>
            <Badge variant="success">
              <Check size={14} className="mr-1" />
              Accessible
            </Badge>
            <Badge variant="success">
              <Check size={14} className="mr-1" />
              Customizable
            </Badge>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ComponentShowcase;
