import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/invoice.css';

export default function Invoice({ embeddedData }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [rating, setRating] = useState(null);

  const data = embeddedData || location.state || {};
  const {
    cartData = [],
    subtotal = 0,
    gst = 0,
    finalTotal = 0,
    mobileNumber = 'WALK-IN'
  } = data;

  const isEmbedded = !!embeddedData;

  const totalQty = cartData.reduce((acc, item) => acc + item.quantity, 0);
  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  const content = (
      <div className="invoice-container" style={isEmbedded ? { margin: '0 auto' } : {}}>
        
        {/* Banner */}
        <div className="invoice-banner">
          <img src="/restaurant_bg.png" alt="Restaurant Background" className="banner-img" onError={(e) => e.target.style.display='none'} />
          <p className="banner-text">40 years of excellence</p>
          <div className="banner-indicators">
            <div className="indicator active"></div>
            <div className="indicator"></div>
            <div className="indicator"></div>
          </div>
        </div>

        {/* Header */}
        <div className="invoice-header">
          <img src="/udupi-banner.png" alt="Data Udipi banner" className="invoice-logo" />
          <div className="invoice-address-bar">
            <span className="bold-text">Data Udipi :</span>
            <span className="address-text">MGR Nagar, Nesapakkam, Chennai, Tamil Nadu 600078</span>
            <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="location-link">
              📍 Location
            </a>
          </div>
        </div>

        {/* Experience Rating */}
        <div className="experience-section">
          <p className="experience-title">Tell Us about your overall experience</p>
          <div className="rating-buttons">
            <button className={`rating-btn ${rating === 'happy' ? 'active happy' : ''}`} onClick={() => setRating('happy')}>
               <span style={{ fontSize: '40px' }}>😃</span>
            </button>
            <button className={`rating-btn ${rating === 'neutral' ? 'active neutral' : ''}`} onClick={() => setRating('neutral')}>
               <span style={{ fontSize: '40px' }}>😐</span>
            </button>
            <button className={`rating-btn ${rating === 'sad' ? 'active sad' : ''}`} onClick={() => setRating('sad')}>
               <span style={{ fontSize: '40px' }}>😞</span>
            </button>
          </div>
        </div>

        {/* Invoice Section */}
        <div className="invoice-details">
          
          <div className="company-header">
            <p className="company-name">Data Udipi Limited</p>
            <p className="company-info"><span className="bold-text">Place Of Supply :</span> Data Udipi - 51, Anna Main Rd, Ponnambalam Colony, MGR Nagar, Nesapakkam, Chennai, Tamil Nadu 600078.</p>
            <p className="company-info">Regd. Office: Chennai.</p>
            <p className="company-gst">GSTIN NO: 29AAACT1836J1ZC</p>
          </div>

          <div className="invoice-title">
            TAX INVOICE
          </div>

          <div className="invoice-meta">
            <div className="meta-left">
              <span className="bold-text">Invoice No :</span> DU104-100034372te<br />
              <span className="bold-text">Counter :</span> 4<br />
              <span className="bold-text">Customer :</span> {mobileNumber === 'WALK-IN' ? 'WALK-IN' : 'REGISTERED'}<br />
              <span className="bold-text">Mobile No :</span> {mobileNumber}
            </div>
            <div className="meta-right">
              {formattedDate}
            </div>
          </div>

          {/* Items Table */}
          <div className="invoice-table">
            <div className="table-header">
              <div>Code/Description</div>
              <div>Price</div>
              <div>QTY</div>
              <div>Net Amt</div>
            </div>
            {cartData.map((item, idx) => (
              <div className="table-row" key={idx}>
                <div>{item.id} / {item.name}</div>
                <div>₹{item.price.toFixed(2)}</div>
                <div>{String(item.quantity).padStart(3, '0')}</div>
                <div>₹{(item.price * item.quantity).toFixed(2)}</div>
              </div>
            ))}
            {cartData.length === 0 && (
              <div className="table-row" style={{ justifyContent: 'center', gridColumn: 'span 4' }}>
                <div>No items in bill</div>
              </div>
            )}
          </div>

          <div className="invoice-totals">
            <div className="totals-labels">
              <p>Gross Total :</p>
              <p>Discount Total :</p>
              <p>Total Invoice Amount :</p>
            </div>
            <div className="totals-values">
              <p>₹{subtotal.toFixed(2)}</p>
              <p>₹0.00</p>
              <p>₹{finalTotal.toFixed(2)}</p>
            </div>
          </div>

          <div className="tax-breakdown">
            <p className="tax-title">Tax Breakdown (GST)</p>
            <div className="tax-grid">
              <div className="tax-col">
                <p className="bold-text">Net Taxable:</p>
                <p>₹{subtotal.toFixed(2)}</p>
              </div>
              <div className="tax-col">
                <p className="bold-text">CGST @2.5%:</p>
                <p>₹{(gst/2).toFixed(2)}</p>
              </div>
              <div className="tax-col">
                <p className="bold-text">SGST @2.5%:</p>
                <p>₹{(gst/2).toFixed(2)}</p>
              </div>
              <div className="tax-col">
                <p className="bold-text">Total GST:</p>
                <p>₹{gst.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="payment-delivery">
            <p className="payment-title">Payment & Delivery</p>
            <div className="payment-row">
              <p>CREDIT CARD (99999***********)</p>
              <p className="bold-text">₹{finalTotal.toFixed(2)}</p>
            </div>
            <div className="payment-row total-received">
              <p className="bold-text">Total received<br/>amount :</p>
              <p className="bold-text">₹{finalTotal.toFixed(2)}</p>
            </div>
          </div>

          <div className="items-summary">
            <p>No of items : {String(cartData.length).padStart(2, '0')}</p>
            <p>Total qty : {totalQty.toFixed(2)}</p>
          </div>

          <div className="qr-code-section">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=DummyPayment123" alt="QR Code" className="qr-img" />
          </div>

          <div className="invoice-terms">
            <p>Terms: * Taxes extra as applicable.</p>
            <p>No return / exchange on prepared food items.</p>
            <p>Thank you for dining with us!</p>
            <p>Call to Action: Love what's in? Explore more from Instagram</p>
            <p>Rewards: DATA UDIPI REWARDS - Scan for loyalty points and offers.</p>
            <p>Billing Provider: Digital billing powered by Razorpay</p>
          </div>
        </div>

        {/* Follow Us */}
        <div className="follow-us">
          <p className="follow-title">Follow us on</p>
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=InstaPage" alt="Social Media" className="social-qr" />
          <div className="download-btn-container">
            <button className="download-btn" onClick={() => window.print()}>
              📥 Download bill
            </button>
          </div>
          <div className="download-btn-container" style={{ marginTop: '10px' }}>
            {!isEmbedded && (
              <button className="download-btn" style={{ backgroundColor: '#ff4e00' }} onClick={() => navigate('/')}>
                🏠 Back to Home
              </button>
            )}
          </div>
        </div>

      </div>
  );

  if (isEmbedded) return content;

  return (
    <div className="invoice-page">
      {content}
    </div>
  );
}
