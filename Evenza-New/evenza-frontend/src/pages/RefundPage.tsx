import React, { useState } from 'react';
const RefundPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [submissionMessage, setSubmissionMessage] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the data to your server
    // For now, we will just show a success message
    setSubmissionMessage('Your refund request has been submitted successfully!');
    // Reset form fields
    setName('');
    setEmail('');
    setOrderNumber('');
    setRefundReason('');
  };
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Request a Refund</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full p-2 border rounded"
              placeholder="Your Name"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-2 border rounded"
              placeholder="Your Email"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Order Number</label>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              required
              className="w-full p-2 border rounded"
              placeholder="Your Order Number"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Refund</label>
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              required
              className="w-full p-2 border rounded"
              placeholder="Please explain the reason for your refund"
              rows="4"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition-colors"
          >
            Submit Refund Request
          </button>
        </form>
        {submissionMessage && <p className="mt-4 text-green-600">{submissionMessage}</p>}
      </div>
    </div>
  );
};
export default RefundPage;