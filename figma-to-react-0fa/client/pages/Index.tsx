import { useState } from "react";

type ExperienceRating = "happy" | "neutral" | "sad" | null;

export default function Index() {
  const [rating, setRating] = useState<ExperienceRating>(null);

  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center py-6 px-4 font-poppins">
      <div className="w-full max-w-[509px] bg-white rounded-2xl overflow-hidden shadow-lg">
        {/* ── Banner ── */}
        <BannerSection />

        {/* ── Restaurant Header ── */}
        <RestaurantHeader />

        {/* ── Experience Rating ── */}
        <ExperienceSection rating={rating} onRate={setRating} />

        {/* ── Tax Invoice ── */}
        <InvoiceSection />

        {/* ── Follow Us ── */}
        <FollowUsSection />
      </div>
    </div>
  );
}

/* ─────────────────── Banner ─────────────────── */
function BannerSection() {
  return (
    <div className="relative mx-6 mt-8 mb-1">
      <img
        src="https://api.builder.io/api/v1/image/assets/TEMP/f8ad669e20359a7960fc6247a6d3f5adad896708?width=924"
        alt="Data Udipi banner"
        className="w-full h-[151px] object-cover rounded-lg"
      />
      {/* "40 years of excellence" overlay text */}
      <p
        className="absolute inset-0 flex items-center justify-center text-white font-semibold text-base tracking-[6.72px] uppercase"
        style={{ textShadow: "0 2px 2px rgba(0,0,0,0.61)" }}
      >
        40 years of excellence
      </p>

      {/* Slide indicators */}
      <div className="flex gap-2 mt-3">
        <div className="h-1 rounded-full bg-white flex-[142]" />
        <div className="h-1 rounded-full bg-white/50 flex-[125]" />
        <div className="h-1 rounded-full bg-white/50 flex-[106]" />
      </div>
    </div>
  );
}

/* ─────────────────── Restaurant Header ─────────────────── */
function RestaurantHeader() {
  return (
    <div className="bg-white shadow-[0_4px_19px_0_rgba(0,0,0,0.10)] px-6 pt-0 pb-4 mt-4">
      {/* Logo */}
      <div className="flex justify-center">
        <img
          src="https://api.builder.io/api/v1/image/assets/TEMP/1605fe590ec10f7dfb62e850cc280c1b629a4a32?width=436"
          alt="Data Udipi logo"
          className="h-[69px] w-auto object-contain"
        />
      </div>

      {/* Name + Address + Location */}
      <div className="flex flex-wrap items-start gap-x-2 gap-y-1 mt-1">
        <span className="text-black font-semibold text-2xl capitalize whitespace-nowrap">
          Data Udipi :
        </span>
        <span className="text-black font-medium text-[13px] capitalize flex-1 min-w-[160px] pt-1">
          MGR Nagar, Nesapakkam, Chennai, Tamil Nadu 600078
        </span>
        <a
          href="https://maps.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[#FF3400] text-xs underline capitalize whitespace-nowrap self-end"
        >
          <LocationPin />
          Location
        </a>
      </div>
    </div>
  );
}

function LocationPin() {
  return (
    <svg width="12" height="15" viewBox="0 0 12 15" fill="none">
      <path
        d="M6 0C2.69254 0 7.06038e-05 2.69115 7.06038e-05 5.997C-0.0224291 10.8246 5.34001 14.6927 5.565 14.8576C5.6925 14.9475 5.85 15 6 15C6.15 15 6.3075 14.955 6.435 14.8576C6.65999 14.6927 12.0224 10.8321 11.9999 5.997C11.9999 2.69115 9.30746 0 6 0ZM6 8.9955C4.34252 8.9955 3.00004 7.65367 3.00004 5.997C3.00004 4.34033 4.34252 2.9985 6 2.9985C7.65748 2.9985 8.99996 4.34033 8.99996 5.997C8.99996 7.65367 7.65748 8.9955 6 8.9955Z"
        fill="#FF3400"
      />
    </svg>
  );
}

/* ─────────────────── Experience Rating ─────────────────── */
function ExperienceSection({
  rating,
  onRate,
}: {
  rating: "happy" | "neutral" | "sad" | null;
  onRate: (r: "happy" | "neutral" | "sad") => void;
}) {
  return (
    <div className="bg-[#F1F5F8] px-6 py-6">
      <p className="text-black font-semibold text-base text-center lowercase mb-4">
        Tell Us about your overall experience
      </p>
      <div className="flex items-center justify-center gap-8">
        {/* Happy */}
        <button
          onClick={() => onRate("happy")}
          className={`transition-transform ${rating === "happy" ? "scale-110" : "hover:scale-105"}`}
          aria-label="Happy"
        >
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path
              d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z"
              stroke={rating === "happy" ? "#00A01D" : "#00A01D"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={rating === "happy" ? "rgba(0,160,29,0.1)" : "none"}
            />
            <path
              d="M16 28C16 28 19 32 24 32C29 32 32 28 32 28M18 18H18.02M30 18H30.02"
              stroke="#00A01D"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Neutral */}
        <button
          onClick={() => onRate("neutral")}
          className={`transition-transform ${rating === "neutral" ? "scale-110" : "hover:scale-105"}`}
          aria-label="Neutral"
        >
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path
              d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z"
              stroke="#D6A906"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={rating === "neutral" ? "rgba(214,169,6,0.1)" : "none"}
            />
            <path
              d="M16 31C16 31 19 31 24 31C29 31 32.5 31 32.5 31M18 18H18.02M30 18H30.02"
              stroke="#D6A906"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Sad */}
        <button
          onClick={() => onRate("sad")}
          className={`transition-transform ${rating === "sad" ? "scale-110" : "hover:scale-105"}`}
          aria-label="Sad"
        >
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path
              d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z"
              stroke="#F10000"
              strokeWidth="2"
              strokeLinecap="round"
              fill={rating === "sad" ? "rgba(241,0,0,0.1)" : "none"}
            />
            <path
              d="M15.7617 32.488C16.7477 31.634 18.0457 31.018 19.4457 30.614C20.9279 30.1992 22.4606 29.9926 23.9997 30C25.5717 30 27.1397 30.206 28.5537 30.614C29.9537 31.018 31.2537 31.634 32.2377 32.488"
              stroke="#F10000"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M18 18C19.1046 18 20 18.8954 20 20C20 21.1046 19.1046 22 18 22C16.8954 22 16 21.1046 16 20C16 18.8954 16.8954 18 18 18Z"
              fill="#F10000"
              stroke="white"
              strokeLinecap="round"
            />
            <path
              d="M30 18C31.1046 18 32 18.8954 32 20C32 21.1046 31.1046 22 30 22C28.8954 22 28 21.1046 28 20C28 18.8954 28.8954 18 30 18Z"
              fill="#F10000"
              stroke="white"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ─────────────────── Invoice Section ─────────────────── */
function InvoiceSection() {
  return (
    <div className="px-5 py-6 space-y-0">
      {/* Company Header */}
      <div className="text-center pb-4 border-b border-[#D4D4D4]">
        <p className="text-black font-semibold text-base capitalize">
          Data Udipi Limited
        </p>
        <p className="text-black text-sm font-normal mt-1 leading-snug">
          <span className="font-semibold text-[15px]">Place Of Supply : </span>
          Data Udipi - 51, Anna Main Rd, Ponnambalam Colony, MGR Nagar,
          Nesapakkam, Chennai, Tamil Nadu 600078.
        </p>
        <p className="text-black font-medium text-sm mt-1">
          Regd. Office: Chennai.
        </p>
        <p className="text-black font-semibold text-base capitalize mt-1">
          GSTIN NO: 29AAACT1836J1ZC
        </p>
      </div>

      {/* TAX INVOICE title */}
      <div className="text-center py-4 border-b border-[#D4D4D4]">
        <p className="text-black font-semibold text-xl capitalize">
          TAX INVOICE
        </p>
      </div>

      {/* Invoice meta */}
      <div className="flex justify-between items-start py-4 border-b border-[#D4D4D4] gap-4">
        <div className="text-[14px] leading-[27px] tracking-[0.7px] uppercase">
          <span className="font-semibold text-black">Invoice No : </span>
          <span className="font-medium text-[#585555]">DU104-100034372te</span>
          <br />
          <span className="font-semibold text-black">Counter : </span>
          <span className="font-medium text-[#585555]">4</span>
          <br />
          <span className="font-semibold text-black">Customer : </span>
          <span className="font-medium text-[#585555]">WALK-IN</span>
          <br />
          <span className="font-semibold text-black">Mobile No : </span>
          <span className="font-medium text-[#585555]">82166432250</span>
        </div>
        <p className="text-black font-semibold text-[14px] uppercase whitespace-nowrap">
          2024-07-11 20:54:00
        </p>
      </div>

      {/* Items Table */}
      <div className="py-4 border-b border-[#D4D4D4]">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 mb-3">
          <p className="text-black font-semibold text-[14px] uppercase leading-tight">
            Code/<br />Description
          </p>
          <p className="text-black font-semibold text-[14px] uppercase">Price</p>
          <p className="text-black font-semibold text-[14px] uppercase">QTY/Unit</p>
          <p className="text-black font-semibold text-[14px] uppercase">Net Amt</p>
        </div>

        {/* Item rows */}
        <InvoiceItem
          code="70001 / Onion Rava Dosa"
          price="₹100."
          qty="001"
          netAmt="₹100.00"
        />
        <InvoiceItem
          code="70002 / Filter Coffee (1 PC)"
          price="₹40."
          qty="001"
          netAmt="₹40.00"
        />
      </div>

      {/* Totals */}
      <div className="py-4 border-b border-[#D4D4D4]">
        <div className="flex justify-between items-center">
          <div className="text-black font-semibold text-[14px] uppercase leading-[24px]">
            <p>Gross Total :</p>
            <p>Discount Total :</p>
            <p>Total Invoice Amount :</p>
          </div>
          <div className="text-black font-semibold text-[14px] uppercase leading-[24px] text-right">
            <p>₹140.00</p>
            <p>₹0.00</p>
            <p>₹140.00</p>
          </div>
        </div>
      </div>

      {/* Tax Breakdown */}
      <div className="py-4 border-b border-[#D4D4D4]">
        <p className="text-black font-semibold text-base uppercase text-center mb-3">
          Tax Breakdown (GST)
        </p>
        <div className="grid grid-cols-4 gap-1 text-[13px]">
          <p className="font-semibold text-black uppercase">Net Taxable:</p>
          <p className="font-semibold text-black uppercase">CGST @2.5%:</p>
          <p className="font-semibold text-black uppercase">SGST @2.5%:</p>
          <p className="font-semibold text-black uppercase">Total GST:</p>

          <p className="text-[#666] font-medium uppercase">₹6.66</p>
          <p className="text-[#666] font-medium uppercase">₹3.33</p>
          <p className="text-[#666] font-medium uppercase">₹3.33</p>
          <p className="text-[#666] font-medium uppercase">₹133.34</p>
        </div>
      </div>

      {/* Payment & Delivery */}
      <div className="py-4 border-b border-[#D4D4D4]">
        <p className="text-black font-semibold text-base uppercase mb-2">
          Payment &amp; Delivery
        </p>
        <div className="flex justify-between items-center">
          <p className="text-[#666] font-medium text-[14px] uppercase">
            CREDIT CARD (99999***********)
          </p>
          <p className="text-black font-semibold text-[14px] uppercase">
            ₹140.00
          </p>
        </div>
        <div className="flex justify-between items-start mt-1">
          <div>
            <p className="text-black font-semibold text-[14px] uppercase leading-[24px]">
              Total received
              <br />
              amount :
            </p>
          </div>
          <p className="text-black font-semibold text-[14px] uppercase">
            ₹140.00
          </p>
        </div>
      </div>

      {/* No of items / qty */}
      <div className="py-4 border-b border-[#D4D4D4]">
        <p className="text-black font-semibold text-[14px] uppercase leading-[24px]">
          No of items : 02
        </p>
        <p className="text-black font-semibold text-[14px] uppercase leading-[24px]">
          Total qty : 1.00
        </p>
      </div>

      {/* QR Code */}
      <div className="py-4 flex justify-center">
        <img
          src="https://api.builder.io/api/v1/image/assets/TEMP/387e7fd7b6288510d9c9c3728bb10367dde433bc?width=768"
          alt="QR Code"
          className="w-full max-w-[384px] h-auto"
        />
      </div>

      {/* Terms */}
      <div className="py-2">
        <p className="text-black text-center text-[12px] font-normal leading-[15px] lowercase">
          Terms: * Taxes extra as applicable.
          <br />
          No return / exchange on prepared food items.
          <br />
          Thank you for dining with us!
          <br />
          Call to Action: Love what's in? Explore more from [Instagram Icon]
          <br />
          Rewards: DATA UDIPI REWARDS - Scan for loyalty points and offers.
          <br />
          Billing Provider: Digital billing powered by Razorpay
        </p>
      </div>
    </div>
  );
}

function InvoiceItem({
  code,
  price,
  qty,
  netAmt,
}: {
  code: string;
  price: string;
  qty: string;
  netAmt: string;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 mb-1">
      <p className="text-[#5E5E5E] font-medium text-[14px] uppercase">{code}</p>
      <p className="text-[#5E5E5E] font-medium text-[14px] uppercase">{price}</p>
      <p className="text-[#5E5E5E] font-medium text-[14px] uppercase">{qty}</p>
      <p className="text-[#5E5E5E] font-medium text-[14px] uppercase">{netAmt}</p>
    </div>
  );
}

/* ─────────────────── Follow Us ─────────────────── */
function FollowUsSection() {
  return (
    <div className="pb-8">
      <p className="text-black font-medium text-2xl capitalize text-center mb-4 tracking-[0.48px]">
        Follow us on
      </p>
      <div className="flex justify-center">
        <img
          src="https://api.builder.io/api/v1/image/assets/TEMP/7939d5dca3690555bf8b05913f4e7c27ea6a3b67?width=332"
          alt="Social media QR code"
          className="w-[166px] h-auto object-contain"
        />
      </div>

      {/* Download Bill button */}
      <div className="flex justify-end pr-6 mt-4">
        <button className="flex items-center gap-2 bg-[#00A01D] text-white font-medium text-[15px] capitalize tracking-[0.3px] px-4 py-1.5 rounded-lg hover:bg-[#008a18] transition-colors">
          <DownloadIcon />
          Download bill
        </button>
      </div>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="17" height="16" viewBox="0 0 17 16" fill="none">
      <path
        d="M3.48038 4.22635C3.67801 3.04559 4.2918 1.97271 5.21245 1.19875C6.13309 0.424798 7.30084 0 8.50776 0C9.71469 0 10.8824 0.424798 11.8031 1.19875C12.7237 1.97271 13.3375 3.04559 13.5351 4.22635C14.04 4.27327 14.5304 4.41937 14.9777 4.65613C15.4251 4.89289 15.8205 5.21556 16.1408 5.60537C16.4611 5.99517 16.7001 6.44429 16.8436 6.92658C16.9872 7.40886 17.0325 7.91466 16.977 8.4145C16.3139 7.38709 15.3237 6.60879 14.1636 6.20314C13.0035 5.79748 11.7401 5.78771 10.5738 6.17538C9.40749 6.56306 8.40517 7.32595 7.72594 8.34298C7.04671 9.36001 6.72948 10.5729 6.82461 11.7891H3.83706C2.85175 11.7931 1.90298 11.4195 1.18879 10.7463C0.474601 10.0732 0.0501977 9.15243 0.00417475 8.17636C-0.0418482 7.20028 0.294067 6.2443 0.941796 5.50797C1.58953 4.77164 2.49901 4.31188 3.48038 4.22466M17 11.368C17 12.5965 16.5079 13.7747 15.6319 14.6433C14.756 15.512 13.568 16 12.3293 16C11.0905 16 9.90249 15.512 9.02656 14.6433C8.15064 13.7747 7.65854 12.5965 7.65854 11.368C7.65854 10.1395 8.15064 8.96138 9.02656 8.09271C9.90249 7.22405 11.0905 6.73604 12.3293 6.73604C13.568 6.73604 14.756 7.22405 15.6319 8.09271C16.5079 8.96138 17 10.1395 17 11.368ZM12.7539 8.84148C12.7539 8.7298 12.7091 8.6227 12.6295 8.54373C12.5499 8.46476 12.4419 8.42039 12.3293 8.42039C12.2166 8.42039 12.1086 8.46476 12.029 8.54373C11.9494 8.6227 11.9046 8.7298 11.9046 8.84148V12.878L10.5068 11.491C10.4271 11.4119 10.319 11.3675 10.2062 11.3675C10.0934 11.3675 9.98531 11.4119 9.90558 11.491C9.82585 11.57 9.78106 11.6773 9.78106 11.7891C9.78106 11.9009 9.82585 12.0082 9.90558 12.0872L12.0286 14.1927C12.0681 14.2319 12.1149 14.263 12.1665 14.2842C12.2181 14.3055 12.2734 14.3164 12.3293 14.3164C12.3851 14.3164 12.4404 14.3055 12.492 14.2842C12.5436 14.263 12.5904 14.2319 12.6299 14.1927L14.7529 12.0872C14.7924 12.0481 14.8237 12.0016 14.8451 11.9505C14.8665 11.8993 14.8774 11.8445 14.8774 11.7891C14.8774 11.7337 14.8665 11.6789 14.8451 11.6278C14.8237 11.5766 14.7924 11.5301 14.7529 11.491C14.7134 11.4518 14.6666 11.4208 14.615 11.3996C14.5634 11.3784 14.5081 11.3675 14.4523 11.3675C14.3965 11.3675 14.3412 11.3784 14.2896 11.3996C14.238 11.4208 14.1912 11.4518 14.1517 11.491L12.7539 12.878V8.84148Z"
        fill="white"
      />
    </svg>
  );
}
