import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Download, ArrowRight, Home, CreditCard, Calendar, Package } from 'lucide-react';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    let isMounted = true;
    let timer;

    // Get payment details from location state or localStorage
    const details = location.state?.paymentDetails || JSON.parse(localStorage.getItem('userPlan') || '{}');
    
    if (!details.orderId && !details.paymentId) {
      // No payment details, redirect to plans
      navigate('/plans', { replace: true });
      return;
    }

    if (isMounted) {
      setPaymentDetails(details);
    }

    // Countdown timer
    timer = setInterval(() => {
      if (isMounted) {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            if (isMounted) {
              navigate('/dashboard', { replace: true });
            }
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    // Confetti animation
    createConfetti();

    return () => {
      isMounted = false;
      if (timer) clearInterval(timer);
    };
  }, [location, navigate]);

  const createConfetti = () => {
    const colors = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6'];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = Math.random() * 3 + 's';
      confetti.style.animationDuration = Math.random() * 3 + 2 + 's';
      document.body.appendChild(confetti);

      setTimeout(() => confetti.remove(), 5000);
    }
  };

  const handleDownloadReceipt = async () => {
    try {
      // Fetch receipt data from backend
      const response = await fetch(`http://localhost:5000/api/payment/receipt/${paymentDetails.orderId}`);
      const data = await response.json();
      
      if (!data.success) {
        alert('Failed to generate receipt. Please try again.');
        return;
      }
      
      const receipt = data.data;
      
      // Create detailed receipt content
      const receiptContent = `
${'='.repeat(70)}
                    PLACEMENT AI - PAYMENT RECEIPT
${'='.repeat(70)}

Receipt Number: ${receipt.receipt_number}
Invoice Number: ${receipt.invoice_number}
Date: ${receipt.date}
Time: ${receipt.time}

${'-'.repeat(70)}
CUSTOMER DETAILS
${'-'.repeat(70)}
Name: ${receipt.customer.name}
Mobile: ${receipt.customer.mobile}
Email: ${receipt.customer.email}

${'-'.repeat(70)}
PAYMENT DETAILS
${'-'.repeat(70)}
Order ID: ${receipt.payment.order_id}
Payment ID: ${receipt.payment.payment_id}
Payment Method: ${receipt.payment.method}
Status: ${receipt.payment.status}

${'-'.repeat(70)}
ITEM DETAILS
${'-'.repeat(70)}
${receipt.items.map((item, i) => 
  `${i + 1}. ${item.description}
   Quantity: ${item.quantity}
   Unit Price: ₹${item.unit_price.toFixed(2)}
   Amount: ₹${item.amount.toFixed(2)}`
).join('\n\n')}

${'-'.repeat(70)}
AMOUNT BREAKDOWN
${'-'.repeat(70)}
Subtotal:                                    ₹${receipt.amounts.subtotal.toFixed(2)}
GST (${receipt.amounts.gst_rate}):                                     ₹${receipt.amounts.gst.toFixed(2)}
${'-'.repeat(70)}
Total Amount:                                ₹${receipt.amounts.total.toFixed(2)}
${'-'.repeat(70)}

${'-'.repeat(70)}
COMPANY DETAILS
${'-'.repeat(70)}
${receipt.company.name}
${receipt.company.address}
Email: ${receipt.company.email}
Website: ${receipt.company.website}
GSTIN: ${receipt.company.gstin}

${'-'.repeat(70)}
TERMS & CONDITIONS
${'-'.repeat(70)}
${receipt.terms.map((term, i) => `${i + 1}. ${term}`).join('\n')}

${'='.repeat(70)}
              Thank you for your purchase!
${'='.repeat(70)}
    `;

      const blob = new Blob([receiptContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${receipt.invoice_number}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      console.log('Receipt downloaded successfully');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Failed to download receipt. Please try again or contact support.');
    }
  };

  if (!paymentDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 dark:from-gray-900 dark:via-[#0a0118] dark:to-purple-900/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 dark:from-gray-900 dark:via-[#0a0118] dark:to-purple-900/20 py-12 px-4 sm:px-6 lg:px-8">
      <style>
        {`
          @keyframes confetti-fall {
            to {
              transform: translateY(100vh) rotate(360deg);
              opacity: 0;
            }
          }
          .confetti {
            position: fixed;
            width: 10px;
            height: 10px;
            top: -10px;
            z-index: 9999;
            animation: confetti-fall linear forwards;
          }
        `}
      </style>

      <div className="max-w-3xl mx-auto">
        {/* Success Icon & Message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full mb-6 animate-bounce">
            <CheckCircle size={64} className="text-green-600 dark:text-green-400" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            🎉 Payment Successful!
          </h1>
          
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
            Thank you for your purchase. Your account has been upgraded!
          </p>
          
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Redirecting to dashboard in <span className="font-bold text-purple-600 dark:text-purple-400">{countdown}</span> seconds...
          </p>
        </div>

        {/* Payment Details Card */}
        <div className="bg-white dark:bg-[#1e1a2e] rounded-2xl shadow-2xl overflow-hidden border-2 border-green-500 dark:border-green-400 mb-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 px-6 py-4">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Package size={24} className="mr-2" />
              {paymentDetails.planName} Plan
            </h2>
          </div>

          {/* Details Grid */}
          <div className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Payment ID */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-start">
                  <CreditCard size={20} className="text-purple-600 dark:text-purple-400 mr-2 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Payment ID</p>
                    <p className="text-sm font-mono text-gray-900 dark:text-white break-all">
                      {paymentDetails.paymentId || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order ID */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-start">
                  <Package size={20} className="text-blue-600 dark:text-blue-400 mr-2 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Order ID</p>
                    <p className="text-sm font-mono text-gray-900 dark:text-white break-all">
                      {paymentDetails.orderId || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-start">
                  <CreditCard size={20} className="text-green-600 dark:text-green-400 mr-2 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Amount Paid</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ₹{paymentDetails.amount ? (paymentDetails.amount / 100).toFixed(2) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Purchase Date */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-start">
                  <Calendar size={20} className="text-orange-600 dark:text-orange-400 mr-2 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Purchase Date</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {paymentDetails.purchaseDate 
                        ? new Date(paymentDetails.purchaseDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle size={24} className="text-green-600 dark:text-green-400 mr-2" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Payment Status</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Transaction completed successfully</p>
                  </div>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-500 text-white">
                  ✓ PAID
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={handleDownloadReceipt}
            className="flex items-center justify-center px-6 py-3 bg-white dark:bg-[#1e1a2e] border-2 border-purple-300 dark:border-purple-600 text-purple-600 dark:text-purple-400 rounded-lg font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
          >
            <Download size={20} className="mr-2" />
            Download Receipt
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <ArrowRight size={20} className="mr-2" />
            Go to Dashboard
          </button>

          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center px-6 py-3 bg-white dark:bg-[#1e1a2e] border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
          >
            <Home size={20} className="mr-2" />
            Back to Home
          </button>
        </div>

        {/* What's Next Section */}
        <div className="bg-white dark:bg-[#1e1a2e] rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            🚀 What's Next?
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                <span className="text-purple-600 dark:text-purple-400 font-bold">1</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Access Premium Features</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">All premium features are now unlocked in your dashboard</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                <span className="text-purple-600 dark:text-purple-400 font-bold">2</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Take Your First Test</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Start with a weekly skills test to assess your current level</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                <span className="text-purple-600 dark:text-purple-400 font-bold">3</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Follow Your Roadmap</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Get personalized learning paths and course recommendations</p>
              </div>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Need help? Contact us at{' '}
            <a href="mailto:support@placementai.com" className="text-purple-600 dark:text-purple-400 hover:underline">
              support@placementai.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
