
const FAQPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-8">Frequently Asked Questions</h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">General Questions</h2>
          <div className="mb-4">
            <h3 className="font-medium text-lg">1. What is Evenza?</h3>
            <p>Evenza is an event management platform that allows users to discover, create, and manage events easily.</p>
          </div>
          <div className="mb-4">
            <h3 className="font-medium text-lg">2. How do I create an account?</h3>
            <p>You can create an account by clicking on the "Sign Up" button on our homepage and filling out the required information.</p>
          </div>
          <div className="mb-4">
            <h3 className="font-medium text-lg">3. How can I reset my password?</h3>
            <p>If you forgot your password, click on the "Forgot Password?" link on the login page and follow the instructions to reset it.</p>
          </div>
          <h2 className="text-2xl font-semibold mb-4">Event Management</h2>
          <div className="mb-4">
            <h3 className="font-medium text-lg">4. How do I create an event?</h3>
            <p>After logging in, click on the "Create Event" button and fill in the necessary details about your event.</p>
          </div>
          <div className="mb-4">
            <h3 className="font-medium text-lg">5. Can I edit my event after it's created?</h3>
            <p>Yes, you can edit your event details by navigating to your event dashboard and selecting the event you wish to edit.</p>
          </div>
          <div className="mb-4">
            <h3 className="font-medium text-lg">6. How do I promote my event?</h3>
            <p>Evenza provides tools to share your event on social media, send email invitations, and more to help you promote your event.</p>
          </div>
          <h2 className="text-2xl font-semibold mb-4">Tickets and Payments</h2>
          <div className="mb-4">
            <h3 className="font-medium text-lg">7. How do I sell tickets for my event?</h3>
            <p>You can set up ticket sales during the event creation process. Choose your ticket types and pricing options.</p>
          </div>
          <div className="mb-4">
            <h3 className="font-medium text-lg">8. What payment methods do you accept?</h3>
            <p>We accept major credit cards, PayPal, and other payment methods for ticket purchases.</p>
          </div>
          <div className="mb-4">
            <h3 className="font-medium text-lg">9. How do I issue refunds for tickets?</h3>
            <p>Refunds can be processed through your event dashboard. Please refer to our refund policy for more details.</p>
          </div>
          <h2 className="text-2xl font-semibold mb-4">Support</h2>
          <div className="mb-4">
            <h3 className="font-medium text-lg">10. How can I contact customer support?</h3>
            <p>You can reach our customer support team by visiting the "Contact Us" page or emailing support@evenza.com.</p>
          </div>
          <div className="mb-4">
            <h3 className="font-medium text-lg">11. Where can I find more resources?</h3>
            <p>Visit our blog and help center for more articles, guides, and tips on using Evenza effectively.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default FAQPage;