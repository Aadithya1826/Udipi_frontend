import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/privacy.css';
const dataudipiTitleImg = `/assets/images/Dataudupi-Title.png`;

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  useEffect(() => {
    // Unlock scrolling for html, body, and root while privacy policy is open
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    const rootEl = document.getElementById('root');
    const prevRootOverflow = rootEl ? rootEl.style.overflow : '';

    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
    if (rootEl) {
      rootEl.style.overflow = 'auto';
    }

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      if (rootEl) {
        rootEl.style.overflow = prevRootOverflow;
      }
    };
  }, []);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="privacy-page-container">
      {/* Top sticky navigation bar */}
      <header className="privacy-header-bar">
        <div className="privacy-header-left">
          <button
            type="button"
            onClick={handleBack}
            className="privacy-back-btn"
            title="Back"
          >
            <i className="fa-solid fa-arrow-left"></i>
            <span>Back</span>
          </button>
          <img
            src={dataudipiTitleImg}
            alt="DATA UDIPI"
            className="privacy-brand-logo"
            onClick={() => navigate('/')}
          />
        </div>
        <div className="privacy-header-badge">
          <i className="fa-solid fa-shield-halved"></i>
          <span>Official Policy</span>
        </div>
      </header>

      {/* Main Privacy Document Content */}
      <main className="privacy-content-wrapper">
        <article className="privacy-card">

          {/* Meta Header */}
          <header className="privacy-meta-header">
            <span className="privacy-badge">Legal Document</span>
            <h1 className="privacy-title">Privacy Policy</h1>
            <p className="privacy-domain">DATA UDIPI | www.dataudipi.com</p>
            <p className="privacy-updated">Last updated: 30 October 2026</p>
          </header>

          {/* Section 1 */}
          <section className="privacy-section">
            <h2 className="privacy-section-title">1. Introduction</h2>
            <p className="privacy-p">
              Welcome to DATA UDIPI (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;). We respect your privacy and are committed to protecting your personal information. This Privacy Policy explains what information we collect, how we use it, who we share it with, and the choices you have when you use our website at www.dataudipi.com and our mobile or web application (together, the &quot;Service&quot;).
            </p>
            <p className="privacy-p">
              By using the Service, you agree to the practices described in this policy. If you do not agree, please do not use the Service.
            </p>
            <p className="privacy-p">
              This policy is written in line with the Information Technology Act, 2000, the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, and the Digital Personal Data Protection Act, 2023 of India.
            </p>
          </section>

          {/* Section 2 */}
          <section className="privacy-section">
            <h2 className="privacy-section-title">2. Information We Collect</h2>

            <h3 className="privacy-section-title sub">a) Information you provide to us</h3>
            <ul className="privacy-list">
              <li>Name</li>
              <li>Mobile number (used for sign up and OTP verification)</li>
              <li>Email address (if you provide it)</li>
              <li>Delivery address and location details (for delivery or pickup orders)</li>
              <li>Order details, food preferences, and special instructions</li>
              <li>Messages, feedback, and queries you send to us</li>
            </ul>

            <h3 className="privacy-section-title sub">b) Information collected automatically</h3>
            <ul className="privacy-list">
              <li>Device information such as device type, operating system, browser type, and app version</li>
              <li>IP address and approximate location</li>
              <li>Usage data such as pages visited, features used, and time spent</li>
              <li>Cookies and similar technologies (see Section 8)</li>
            </ul>

            <h3 className="privacy-section-title sub">c) Information generated through AI features</h3>
            <p className="privacy-p">
              Our Service uses artificial intelligence to help with tasks such as menu suggestions, order assistance, and answering your questions. Your inputs to these features (for example, your chat messages and order preferences) may be processed to provide responses and improve the quality of the Service.
            </p>

            <h3 className="privacy-section-title sub">d) Payment information</h3>
            <p className="privacy-p">
              Payments are processed by third party payment providers. We do not store your complete card, UPI PIN, or net banking credentials on our servers. We may receive limited details such as transaction ID, payment status, and amount.
            </p>
          </section>

          {/* Section 3 */}
          <section className="privacy-section">
            <h2 className="privacy-section-title">3. How We Use Your Information</h2>
            <p className="privacy-p">We use your information to:</p>
            <ul className="privacy-list">
              <li>Create and verify your account through a one time password (OTP) sent by SMS</li>
              <li>Process, confirm, and deliver your orders</li>
              <li>Send you a welcome greeting and order related updates</li>
              <li>Send your invoice and order receipt on WhatsApp or SMS</li>
              <li>Provide customer support and respond to your requests</li>
              <li>Personalise your experience, including AI based suggestions</li>
              <li>Improve our menu, services, and the performance of the Service</li>
              <li>Send offers, promotions, and announcements (only where you have agreed, and you can opt out at any time)</li>
              <li>Prevent fraud, misuse, and security incidents</li>
              <li>Comply with legal and tax obligations</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="privacy-section">
            <h2 className="privacy-section-title">4. Communication Through SMS and WhatsApp</h2>
            <p className="privacy-p">
              When you sign up, we send an OTP to your mobile number by SMS. After you place an order, we may send your invoice and order updates to your mobile number on WhatsApp. By providing your number, you consent to receive these service messages. Promotional messages are sent only with your consent, and you may opt out by replying STOP or by contacting us.
            </p>
            <p className="privacy-p">
              WhatsApp messages are also subject to WhatsApp&apos;s own terms and privacy policy.
            </p>
          </section>

          {/* Section 5 */}
          <section className="privacy-section">
            <h2 className="privacy-section-title">5. Sharing of Your Information</h2>
            <p className="privacy-p">We do not sell your personal information. We share it only in the following cases:</p>
            <ul className="privacy-list">
              <li><strong>Service providers:</strong> Companies that help us run the Service, such as SMS and WhatsApp messaging providers, payment gateways, cloud hosting and storage providers, analytics tools, and AI service providers. They may use your data only to perform services for us.</li>
              <li><strong>Delivery partners:</strong> Where applicable, your name, phone number, and address are shared to deliver your order.</li>
              <li><strong>Legal and safety reasons:</strong> When required by law, court order, or government authority, or to protect our rights, users, and the public.</li>
              <li><strong>Business transfers:</strong> If DATA UDIPI is merged, acquired, or restructured, your information may be transferred to the successor, with the same level of protection.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="privacy-section">
            <h2 className="privacy-section-title">6. Data Retention</h2>
            <p className="privacy-p">
              We keep your personal information only as long as needed for the purposes described in this policy, to provide the Service, and to meet legal, accounting, and tax requirements. When data is no longer needed, we delete it or make it anonymous.
            </p>
          </section>

          {/* Section 7 */}
          <section className="privacy-section">
            <h2 className="privacy-section-title">7. Data Security</h2>
            <p className="privacy-p">
              We use reasonable technical and organisational measures to protect your information, including encrypted connections (HTTPS), access controls, and secure hosting. However, no method of transmission or storage over the internet is completely secure, and we cannot guarantee absolute security. Please keep your OTPs and account details confidential.
            </p>
          </section>

          {/* Section 8 */}
          <section className="privacy-section">
            <h2 className="privacy-section-title">8. Cookies and Similar Technologies</h2>
            <p className="privacy-p">
              We use cookies and similar technologies to keep you signed in, remember your preferences, understand how the Service is used, and improve performance. You can control or disable cookies through your browser settings, but some parts of the Service may not work properly without them.
            </p>
          </section>

          {/* Section 9 */}
          <section className="privacy-section">
            <h2 className="privacy-section-title">9. Your Rights and Choices</h2>
            <p className="privacy-p">Subject to applicable law, you have the right to:</p>
            <ul className="privacy-list">
              <li>Access the personal information we hold about you</li>
              <li>Correct or update inaccurate or incomplete information</li>
              <li>Request deletion of your personal information</li>
              <li>Withdraw your consent at any time (this will not affect processing done before withdrawal)</li>
              <li>Opt out of promotional messages</li>
              <li>Raise a grievance about how your data is handled</li>
              <li>Nominate another person to exercise your rights in case of death or incapacity</li>
            </ul>
            <p className="privacy-p">
              To use any of these rights, contact us using the details in Section 12. We may need to verify your identity before acting on your request.
            </p>
          </section>

          {/* Section 10 */}
          <section className="privacy-section">
            <h2 className="privacy-section-title">10. Children&apos;s Privacy</h2>
            <p className="privacy-p">
              The Service is not intended for children under 18 years of age. We do not knowingly collect personal information from children without verifiable consent of a parent or guardian. If you believe a child has given us personal information, please contact us and we will delete it.
            </p>
          </section>

          {/* Section 11 */}
          <section className="privacy-section">
            <h2 className="privacy-section-title">11. Third Party Links</h2>
            <p className="privacy-p">
              The Service may contain links to third party websites or services, such as payment pages or social media. We are not responsible for the privacy practices of those third parties, and we encourage you to read their policies.
            </p>
          </section>

          {/* Section 12 */}
          <section className="privacy-section">
            <h2 className="privacy-section-title">12. Contact Us and Grievance Officer</h2>
            <p className="privacy-p">
              If you have questions, requests, or complaints about this Privacy Policy or your personal data, please contact:
            </p>
            <div className="privacy-contact-box">
              <div className="contact-item">
                <span className="contact-label">Grievance Officer:</span>
                <span className="contact-value">Customer Support Team</span>
              </div>
              <div className="contact-item">
                <span className="contact-label">Company:</span>
                <span className="contact-value">DATA UDIPI</span>
              </div>
              <div className="contact-item">
                <span className="contact-label">Address:</span>
                <span className="contact-value">Mugalivakkam Main Road / MGR Nagar, Chennai, Tamil Nadu, India</span>
              </div>
              <div className="contact-item">
                <span className="contact-label">Email:</span>
                <span className="contact-value"><a href="mailto:support@dataudipi.com">support@dataudipi.com</a></span>
              </div>
              <div className="contact-item">
                <span className="contact-label">Phone:</span>
                <span className="contact-value"><a href="tel:+919025722328">+91 90257 22328</a></span>
              </div>
              <div className="contact-item">
                <span className="contact-label">Website:</span>
                <span className="contact-value"><a href="https://www.dataudipi.com" target="_blank" rel="noreferrer">www.dataudipi.com</a></span>
              </div>
            </div>
            <p className="privacy-p" style={{ marginTop: '14px' }}>
              We will acknowledge your complaint and aim to resolve it within a reasonable time as required by law.
            </p>
          </section>

          {/* Section 13 */}
          <section className="privacy-section">
            <h2 className="privacy-section-title">13. Changes to This Policy</h2>
            <p className="privacy-p">
              We may update this Privacy Policy from time to time. When we make changes, we will update the &quot;Last updated&quot; date at the top of this page, and where the changes are significant, we will notify you through the Service or by message. Please review this page regularly.
            </p>
          </section>

          {/* Section 14 */}
          <section className="privacy-section">
            <h2 className="privacy-section-title">14. Governing Law</h2>
            <p className="privacy-p">
              This Privacy Policy is governed by the laws of India. Any disputes will be subject to the jurisdiction of the courts at Chennai, Tamil Nadu, India.
            </p>
          </section>

        </article>

        {/* Footer in single straight line */}
        <footer className="privacy-footer-simple">
          <span>Privacy Policy</span>
          <span className="privacy-divider">•</span>
          <span>© {new Date().getFullYear()} DATA UDIPI. All rights reserved.</span>
        </footer>
      </main>
    </div>
  );
}
