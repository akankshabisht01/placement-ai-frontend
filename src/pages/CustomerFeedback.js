import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Updated webhook URL per user request
const WEBHOOK_URL = 'https://n8n-1-2ldl.onrender.com/webhook/55197d5b-d160-43ad-a219-cd8058619fd7';

const initialState = { fullName: '', email: '', contact: '', feedback: '' };

const CustomerFeedback = () => {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.contact.trim()) e.contact = 'Contact No. is required';
    else if (form.contact.replace(/[^\d]/g,'').length < 7) e.contact = 'Contact number seems too short';
    if (!form.feedback.trim()) e.feedback = 'Feedback is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const reset = () => {
    setForm(initialState);
    setErrors({});
    setSubmitting(false);
    setServerError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(er => ({ ...er, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError('');
    setSuccess(false);
    try {
      // Payload shape expected by n8n: send JSON
      const correlationId = uuidv4();
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        contact: form.contact.trim(),
        feedback: form.feedback.trim(),
        submittedAt: new Date().toISOString(),
        correlationId
      };

      const resp = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        // If CORS is not enabled on n8n, you might need 'mode: "no-cors"'.
        // But then you cannot read the response; we try normal first.
      });

      if (!resp.ok && resp.type !== 'opaque') {
        let message = '';
        const contentType = resp.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          try {
            const data = await resp.json();
            message = data?.message || data?.error || JSON.stringify(data);
          } catch (_) {
            // ignore JSON parse error
          }
        } else {
            message = await resp.text();
        }
        if (!message) message = `Request failed with status ${resp.status}`;
        throw new Error(`[Ref: ${correlationId}] ${message}`);
      }
      setSuccess(true);
      reset();
    } catch (err) {
      setServerError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-gradient-to-b from-amber-50 via-orange-50 to-yellow-50 dark:from-[#1a1625] dark:via-[#1e1a2e] dark:to-[#1a1625] py-10 min-h-[calc(100vh-8rem)] transition-colors duration-300">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-amber-900 dark:text-white">
            Customer Feedback
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-amber-700 dark:text-gray-300">
            We value your feedback. Please fill out the form below to help us improve.
          </p>
        </header>
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1e1a2e] border border-amber-200/50 dark:border-pink-500/20 rounded-2xl shadow-sm dark:shadow-glow p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Full Name<span className="text-red-500 dark:text-red-400"> *</span></label>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  className={`w-full rounded-lg border bg-white dark:bg-[#2d1f3d] text-amber-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${errors.fullName? 'border-red-400 dark:border-red-600 focus:ring-red-500 dark:focus:ring-red-600 focus:border-red-500 dark:focus:border-red-600' : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 focus:border-indigo-500 dark:focus:border-indigo-600'} px-3 py-2 text-sm transition-colors duration-200`}
                  placeholder="e.g. Priya Sharma"
                  autoComplete="name"
                />
                {errors.fullName && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.fullName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Email Address<span className="text-red-500 dark:text-red-400"> *</span></label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className={`w-full rounded-lg border bg-white dark:bg-[#2d1f3d] text-amber-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${errors.email? 'border-red-400 dark:border-red-600 focus:ring-red-500 dark:focus:ring-red-600 focus:border-red-500 dark:focus:border-red-600' : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 focus:border-indigo-500 dark:focus:border-indigo-600'} px-3 py-2 text-sm transition-colors duration-200`}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                {errors.email && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Contact No.<span className="text-red-500 dark:text-red-400"> *</span></label>
                <input
                  type="text"
                  name="contact"
                  value={form.contact}
                  onChange={handleChange}
                  className={`w-full rounded-lg border bg-white dark:bg-[#2d1f3d] text-amber-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${errors.contact? 'border-red-400 dark:border-red-600 focus:ring-red-500 dark:focus:ring-red-600 focus:border-red-500 dark:focus:border-red-600' : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 focus:border-indigo-500 dark:focus:border-indigo-600'} px-3 py-2 text-sm transition-colors duration-200`}
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                />
                {errors.contact && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.contact}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Feedback<span className="text-red-500 dark:text-red-400"> *</span></label>
                <textarea
                  name="feedback"
                  rows={5}
                  value={form.feedback}
                  onChange={handleChange}
                  className={`w-full rounded-lg border bg-white dark:bg-[#2d1f3d] text-amber-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${errors.feedback? 'border-red-400 dark:border-red-600 focus:ring-red-500 dark:focus:ring-red-600 focus:border-red-500 dark:focus:border-red-600' : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 focus:border-indigo-500 dark:focus:border-indigo-600'} px-3 py-2 text-sm resize-y transition-colors duration-200`}
                  placeholder="Share your thoughts, issues, or feature suggestions..."
                />
                {errors.feedback && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.feedback}</p>}
              </div>
            </div>

            {serverError && (
              <div className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                {serverError}
              </div>
            )}
            {success && (
              <div className="rounded-lg border border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/30 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                Thank you! Your feedback has been submitted.
              </div>
            )}

            <div className="flex items-center justify-between gap-4 flex-wrap">
              <p className="text-xs text-gray-500 dark:text-gray-400">Fields marked * are required. Data sent securely to our automation workflow.</p>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-sm dark:shadow-glow transition-all duration-200"
              >
                {submitting && <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="4" className="opacity-25"/><path d="M4 12a8 8 0 018-8" strokeWidth="4" className="opacity-75"/></svg>}
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default CustomerFeedback;
