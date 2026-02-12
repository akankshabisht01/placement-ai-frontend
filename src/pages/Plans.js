import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeHelpers';

const Plans = () => {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [userMobile, setUserMobile] = useState('');
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);

  useEffect(() => {
    // Get user details from localStorage
    const getUserDetails = () => {
      try {
        const linkedData = localStorage.getItem('linkedResumeData');
        if (linkedData) {
          const parsed = JSON.parse(linkedData);
          if (parsed.mobile) setUserMobile(parsed.mobile);
          if (parsed.name) setUserName(parsed.name);
          return;
        }

        const userData = localStorage.getItem('userData');
        if (userData) {
          const parsed = JSON.parse(userData);
          if (parsed.mobile) setUserMobile(parsed.mobile);
          if (parsed.name) setUserName(parsed.name);
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    };

    getUserDetails();
  }, []);

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      duration: 'Forever',
      description: 'Perfect for getting started',
      features: [
        'Basic Placement Prediction',
        'Resume Upload & Analysis',
        'ATS Score Check',
        'Basic Career Roadmap',
        'Limited Course Recommendations',
        'Email Support'
      ],
      limitations: [
        'No Weekly Tests',
        'No Advanced Analytics',
        'No Priority Support'
      ],
      buttonText: 'Current Plan',
      isPopular: false,
      color: 'gray'
    },
    {
      id: 'basic',
      name: 'Basic',
      price: 299,
      duration: 'per month',
      description: 'Great for active learners',
      features: [
        'Everything in Free',
        'Weekly Skill Tests',
        'Detailed Performance Analytics',
        'Personalized Roadmaps',
        'Unlimited Course Access',
        'Smart AI Resume Analysis',
        'Priority Email Support',
        'Progress Tracking Dashboard'
      ],
      limitations: [],
      buttonText: 'Get Started',
      isPopular: false,
      color: 'blue'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 499,
      duration: 'per month',
      description: 'For serious job seekers',
      features: [
        'Everything in Basic',
        'Bi-Weekly Advanced Tests',
        'AI-Powered Interview Prep',
        'Mock Interview Sessions',
        'Job Application Tracking',
        'Personalized Study Plans',
        'Certificate of Completion',
        'Dedicated Support Manager',
        '1-on-1 Career Counseling',
        'LinkedIn Profile Optimization'
      ],
      limitations: [],
      buttonText: 'Get Premium',
      isPopular: true,
      color: 'purple'
    },
    {
      id: 'lifetime',
      name: 'Lifetime',
      price: 2999,
      duration: 'one-time',
      description: 'Unlimited access forever',
      features: [
        'Everything in Premium',
        'Lifetime Access to All Features',
        'All Future Updates Free',
        'Unlimited Tests & Analytics',
        'Priority Feature Requests',
        'Exclusive Webinars & Workshops',
        'Job Referral Network Access',
        'Resume Templates Library',
        'Personal Branding Guide',
        'Lifetime Support'
      ],
      limitations: [],
      buttonText: 'Buy Lifetime',
      isPopular: false,
      color: 'green'
    }
  ];

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const createOrder = async (amount, planName) => {
    try {
      console.log('Creating order with:', { amount, planName, mobile: userMobile, name: userName });
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount * 100, // Convert to paise
          currency: 'INR',
          receipt: `receipt_${Date.now()}`,
          notes: {
            mobile: userMobile,
            name: userName,
            plan_name: planName,
            purpose: `${planName} Subscription`
          }
        })
      });

      const data = await response.json();
      console.log('Create order response:', data);
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  const verifyPayment = async (razorpayResponse) => {
    try {
      console.log('Verifying payment:', {
        order_id: razorpayResponse.razorpay_order_id,
        payment_id: razorpayResponse.razorpay_payment_id,
        mobile: userMobile
      });

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/payment/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: razorpayResponse.razorpay_order_id,
          razorpay_payment_id: razorpayResponse.razorpay_payment_id,
          razorpay_signature: razorpayResponse.razorpay_signature,
          mobile: userMobile
        })
      });

      const data = await response.json();
      console.log('Verify payment response:', data);
      
      if (data.success) {
        console.log('✅ Payment verified successfully');
      } else {
        console.error('❌ Payment verification failed:', data.message);
      }
      
      return data.success;
    } catch (error) {
      console.error('❌ Error verifying payment:', error);
      return false;
    }
  };

  const handlePlanPurchase = async (plan) => {
    if (plan.id === 'free') {
      return;
    }

    if (!userMobile) {
      alert('Please sign in to purchase a plan');
      navigate('/signin');
      return;
    }

    console.log('\n=== PAYMENT FLOW START ===');
    console.log('Plan:', plan.name);
    console.log('Amount:', plan.price);
    console.log('User Mobile:', userMobile);
    console.log('User Name:', userName);
    console.log('========================\n');

    setLoading(true);
    setSelectedPlan(plan.id);

    try {
      // Load Razorpay script
      console.log('Step 1: Loading Razorpay script...');
      const scriptLoaded = await loadRazorpayScript();
      
      if (!scriptLoaded) {
        alert('Failed to load payment gateway. Please check your internet connection and try again.');
        setLoading(false);
        setSelectedPlan(null);
        return;
      }
      console.log('✅ Razorpay script loaded');

      // Create order
      console.log('Step 2: Creating payment order...');
      const orderData = await createOrder(plan.price, plan.name);
      console.log('✅ Order created:', orderData.order_id);

      // Show test card info in console for development
      if (orderData.key_id && orderData.key_id.includes('test')) {
        console.log('\n🧪 TEST MODE - Use these test cards:');
        console.log('Success: 4111 1111 1111 1111');
        console.log('Failure: 4000 0000 0000 0002');
        console.log('Expiry: Any future date (e.g., 12/28)');
        console.log('CVV: Any 3 digits (e.g., 123)');
        console.log('OTP: Any value\n');
      }

      // Configure Razorpay options - Using official format
      console.log('Step 3: Configuring Razorpay checkout...');
      const options = {
        key: orderData.key_id, // Key ID from backend
        amount: orderData.amount.toString(), // Amount in paise as string
        currency: orderData.currency,
        name: 'Placement AI',
        description: `${plan.name} Plan Subscription`,
        image: '', // Add your logo URL here if needed
        order_id: orderData.order_id, // Order ID from backend
        handler: async function (response) {
          // Payment successful - verify signature
          console.log('Payment successful:', response);
          const verified = await verifyPayment(response);
          
          setLoading(false);
          setSelectedPlan(null);
          
          if (verified) {
            // Save plan info to localStorage
            const planInfo = {
              planId: plan.id,
              planName: plan.name,
              amount: orderData.amount,
              currency: orderData.currency,
              purchaseDate: new Date().toISOString(),
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature
            };
            localStorage.setItem('userPlan', JSON.stringify(planInfo));
            
            // Redirect to success page
            navigate('/payment-success', { state: { paymentDetails: planInfo } });
          } else {
            alert('❌ Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: userName || 'User',
          email: '', // Add email if available
          contact: userMobile || ''
        },
        notes: {
          mobile: userMobile,
          plan_id: plan.id,
          plan_name: plan.name
        },
        theme: {
          color: '#8B5CF6' // Purple theme matching your design
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal closed by user');
            setLoading(false);
            setSelectedPlan(null);
          }
        }
      };

      // Create Razorpay instance
      const rzp1 = new window.Razorpay(options);
      
      // Handle payment failure - capture all error details
      rzp1.on('payment.failed', async function (response) {
        console.error('=== PAYMENT FAILURE ===');
        console.error('Full response:', response);
        console.error('Error object:', response.error);
        
        const error = response.error || {};
        
        // Log failure to backend with all available details
        try {
          const failureData = {
            order_id: orderData.order_id,
            error: {
              code: error.code || 'UNKNOWN_ERROR',
              description: error.description || 'Payment processing failed',
              reason: error.reason || 'unknown',
              step: error.step || 'unknown',
              source: error.source || 'unknown',
              metadata: error.metadata || {}
            },
            mobile: userMobile
          };
          
          console.log('Logging failure to backend:', failureData);
          
          await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/payment/failure`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(failureData)
          });
          console.log('✅ Payment failure logged to backend');
        } catch (logError) {
          console.error('❌ Failed to log payment failure:', logError);
        }
        
        setLoading(false);
        setSelectedPlan(null);
        
        // Show user-friendly error message
        const errorMessage = 
          `❌ Payment Failed!\n\n` +
          `${error.description || 'Payment could not be completed'}\n\n` +
          (error.reason ? `Reason: ${error.reason}\n` : '') +
          (error.code ? `Error Code: ${error.code}\n` : '') +
          `\nPlease try again with a different payment method or card.\n` +
          `If money was deducted, it will be refunded within 5-7 business days.\n\n` +
          `For assistance, contact support@placementai.com`;
        
        alert(errorMessage);
      });
      
      // Open Razorpay checkout
      console.log('Step 4: Opening Razorpay checkout modal...');
      rzp1.open();
      console.log('✅ Checkout modal opened');

    } catch (error) {
      console.error('\n❌ PAYMENT INITIATION ERROR:');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      let userMessage = '❌ Failed to initiate payment\n\n';
      
      if (error.message.includes('network') || error.message.includes('fetch')) {
        userMessage += '🔌 Network Error:\nPlease check your internet connection and try again.';
      } else if (error.message.includes('order')) {
        userMessage += '📋 Order Creation Failed:\nCould not create payment order. Please try again.';
      } else {
        userMessage += `Error: ${error.message}\n\n`;
        userMessage += 'Troubleshooting:\n';
        userMessage += '• Ensure backend server is running\n';
        userMessage += '• Check your internet connection\n';
        userMessage += '• Try refreshing the page\n';
        userMessage += '• Clear browser cache if issue persists';
      }
      
      alert(userMessage);
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  return (
    <div className={`min-h-screen ${themeClasses.pageBackground} py-12 px-4 sm:px-6 lg:px-8`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className={`text-4xl md:text-5xl font-bold ${themeClasses.textPrimary} mb-4`}>
            Choose Your Perfect Plan
          </h1>
          <p className={`text-lg ${themeClasses.textSecondary} max-w-2xl mx-auto`}>
            Unlock your potential with our comprehensive career development platform
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {plans.map((plan) => {
            const isLoading = loading && selectedPlan === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative ${themeClasses.cardBackground} rounded-2xl border-2 ${themeClasses.cardBorder} ${
                  plan.isPopular ? 'shadow-2xl shadow-glow' : 'shadow-lg'
                } transition-all duration-300 hover:scale-105 flex flex-col`}
              >
                {/* Popular Badge */}
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className={`inline-flex items-center px-4 py-1 rounded-full text-xs font-bold ${themeClasses.gradient} text-white shadow-lg`}>
                      ⭐ MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="p-6 flex-1 flex flex-col">
                  {/* Plan Header */}
                  <div className="mb-6">
                    <h3 className={`text-2xl font-bold ${themeClasses.textPrimary} mb-2`}>
                      {plan.name}
                    </h3>
                    <p className={`text-sm ${themeClasses.textSecondary}`}>
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className={`text-4xl font-bold ${themeClasses.textPrimary}`}>
                        ₹{plan.price}
                      </span>
                      <span className={`ml-2 ${themeClasses.textSecondary} text-sm`}>
                        /{plan.duration}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6 flex-1">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start">
                        <svg className={`w-5 h-5 ${themeClasses.accent} mr-2 flex-shrink-0 mt-0.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className={`text-sm ${themeClasses.textPrimary}`}>
                          {feature}
                        </span>
                      </div>
                    ))}
                    
                    {plan.limitations.map((limitation, index) => (
                      <div key={`limit-${index}`} className="flex items-start opacity-50">
                        <svg className={`w-5 h-5 ${themeClasses.textSecondary} mr-2 flex-shrink-0 mt-0.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className={`text-sm ${themeClasses.textSecondary}`}>
                          {limitation}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Button */}
                  <button
                    onClick={() => handlePlanPurchase(plan)}
                    disabled={plan.id === 'free' || isLoading}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                      plan.id === 'free'
                        ? `${themeClasses.buttonSecondary} cursor-not-allowed opacity-50`
                        : `${themeClasses.buttonPrimary} shadow-lg hover:shadow-xl transform hover:-translate-y-0.5`
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      plan.buttonText
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className={`${themeClasses.cardBackground} rounded-2xl p-8 shadow-lg border ${themeClasses.cardBorder}`}>
          <h2 className={`text-2xl font-bold ${themeClasses.textPrimary} mb-6 text-center`}>
            Frequently Asked Questions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className={`font-semibold ${themeClasses.textPrimary} mb-2`}>
                Can I upgrade my plan later?
              </h3>
              <p className={`text-sm ${themeClasses.textSecondary}`}>
                Yes! You can upgrade to any higher plan at any time. The remaining amount will be adjusted.
              </p>
            </div>
            
            <div>
              <h3 className={`font-semibold ${themeClasses.textPrimary} mb-2`}>
                Is there a refund policy?
              </h3>
              <p className={`text-sm ${themeClasses.textSecondary}`}>
                We offer a 7-day money-back guarantee for all paid plans. No questions asked!
              </p>
            </div>
            
            <div>
              <h3 className={`font-semibold ${themeClasses.textPrimary} mb-2`}>
                What payment methods do you accept?
              </h3>
              <p className={`text-sm ${themeClasses.textSecondary}`}>
                We accept all major credit/debit cards, UPI, net banking, and digital wallets via Razorpay.
              </p>
            </div>
            
            <div>
              <h3 className={`font-semibold ${themeClasses.textPrimary} mb-2`}>
                Will I get a certificate?
              </h3>
              <p className={`text-sm ${themeClasses.textSecondary}`}>
                Premium and Lifetime members receive a certificate of completion after finishing courses.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 text-center">
          <div className={`flex items-center justify-center space-x-6 ${themeClasses.textSecondary}`}>
            <div className="flex items-center">
              <svg className={`w-5 h-5 ${themeClasses.accent} mr-2`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Secure Payment
            </div>
            <div className="flex items-center">
              <svg className={`w-5 h-5 ${themeClasses.accent} mr-2`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              24/7 Support
            </div>
            <div className="flex items-center">
              <svg className={`w-5 h-5 ${themeClasses.accent} mr-2`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Money-back Guarantee
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Plans;
