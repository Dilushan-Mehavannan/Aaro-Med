import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const md5 = (str) => crypto.createHash('md5').update(str).digest('hex');

export const generatePayHereHash = (orderId, amount, currency) => {
  const merchantId = process.env.PAYHERE_MERCHANT_ID || '1228422';
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET || 'E48C7B011196C3C51C817454C99FF810';
  const amountFormatted = parseFloat(amount || 0).toFixed(2);
  const secretHash = md5(merchantSecret).toUpperCase();
  const hash = md5(merchantId + orderId + amountFormatted + currency + secretHash).toUpperCase();
  return hash;
};

export const verifyPayHereCallback = (params) => {
  const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig } = params;
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET || 'E48C7B011196C3C51C817454C99FF810';
  const secretHash = md5(merchantSecret).toUpperCase();
  const local_md5sig = md5((merchant_id || '') + (order_id || '') + (payhere_amount || '') + (payhere_currency || '') + (status_code || '') + secretHash).toUpperCase();
  return local_md5sig === md5sig;
};
