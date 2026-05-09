const fs = require('fs');
const path = require('path');

const srcDir = path.join('d:', 'TECH WIZARD FOLDER-INTERN', 'Restaurant app2', 'src', 'pages');

const read = f => fs.readFileSync(path.join(srcDir, f), 'utf8');
const write = (f, c) => fs.writeFileSync(path.join(srcDir, f), c);

let dineIn = read('DineIn.jsx');
dineIn = dineIn.replace(/export default function DineIn/g, 'export default function TakeAway');
dineIn = dineIn.replace(/<button className="di-ot-tab active"><i className="fa-solid fa-utensils" \/> \{t\('dineIn'\)\}<\/button>[\s\S]*?<button className="di-ot-tab"><i className="fa-solid fa-bag-shopping" \/> \{t\('takeAway'\)\}<\/button>/, 
`<button className="di-ot-tab" onClick={() => navigate('/dine-in')}><i className="fa-solid fa-utensils" /> {t('dineIn')}</button>
            <button className="di-ot-tab active"><i className="fa-solid fa-bag-shopping" /> {t('takeAway')}</button>`);
dineIn = dineIn.replace(/navigate\('\/checkout'\)/g, 'navigate(\'/takeaway-checkout\')');
write('TakeAway.jsx', dineIn);

let checkout = read('Checkout.jsx');
checkout = checkout.replace(/const Checkout = \(\) =>/g, 'const TakeAwayCheckout = () =>');
checkout = checkout.replace(/export default Checkout;/g, 'export default TakeAwayCheckout;');
checkout = checkout.replace(/Dine In Order/g, 'Take Away Order');
checkout = checkout.replace(/to="\/dine-in"/g, 'to="/take-away"');
checkout = checkout.replace(/navigate\('\/payment'/g, 'navigate(\'/takeaway-payment\'');
checkout = checkout.replace(/<button className="di-ot-tab active"><i className="fa-solid fa-utensils" \/> Dine In<\/button>[\s\S]*?<button className="di-ot-tab"><i className="fa-solid fa-bag-shopping" \/> Take Away<\/button>/, 
`<button className="di-ot-tab" onClick={() => navigate('/dine-in')}><i className="fa-solid fa-utensils" /> Dine In</button>
            <button className="di-ot-tab active"><i className="fa-solid fa-bag-shopping" /> Take Away</button>`);
write('TakeAwayCheckout.jsx', checkout);

let payment = read('Payment.jsx');
payment = payment.replace(/const Payment = \(\) =>/g, 'const TakeAwayPayment = () =>');
payment = payment.replace(/export default Payment;/g, 'export default TakeAwayPayment;');
payment = payment.replace(/to="\/checkout"/g, 'to="/takeaway-checkout"');
payment = payment.replace(/navigate\('\/checkout'\)/g, 'navigate(\'/takeaway-checkout\')');
payment = payment.replace(/navigate\('\/order-success'/g, 'navigate(\'/takeaway-order-success\'');
payment = payment.replace(/<button className="di-ot-tab active"><i className="fa-solid fa-utensils" \/> Dine In<\/button>[\s\S]*?<button className="di-ot-tab"><i className="fa-solid fa-bag-shopping" \/> Take Away<\/button>/, 
`<button className="di-ot-tab" onClick={() => navigate('/dine-in')}><i className="fa-solid fa-utensils" /> Dine In</button>
            <button className="di-ot-tab active"><i className="fa-solid fa-bag-shopping" /> Take Away</button>`);
write('TakeAwayPayment.jsx', payment);

let orderSuccess = read('OrderSuccess.jsx');
orderSuccess = orderSuccess.replace(/const OrderSuccess = \(\) =>/g, 'const TakeAwayOrderSuccess = () =>');
orderSuccess = orderSuccess.replace(/export default OrderSuccess;/g, 'export default TakeAwayOrderSuccess;');
orderSuccess = orderSuccess.replace(/navigate\('\/invoice'/g, 'navigate(\'/takeaway-invoice\'');
write('TakeAwayOrderSuccess.jsx', orderSuccess);

let invoice = read('Invoice.jsx');
invoice = invoice.replace(/const Invoice = \(\) =>/g, 'const TakeAwayInvoice = () =>');
invoice = invoice.replace(/export default Invoice;/g, 'export default TakeAwayInvoice;');
invoice = invoice.replace(/DINE-IN ORDER/g, 'TAKE-AWAY ORDER');
write('TakeAwayInvoice.jsx', invoice);

console.log('Files copied and modified successfully!');
