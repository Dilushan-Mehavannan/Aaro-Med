import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const md5 = (str) => crypto.createHash('md5').update(str).digest('hex');

export const generatePayHereHash = (orderId, amount, currency) => {
  const merchantId = process.env.PAYHERE_MERCHANT_ID;
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
  const amountFormatted = parseFloat(amount).toFixed(2);
  const secretHash = md5(merchantSecret).toUpperCase();
  const hash = md5(merchantId + orderId + amountFormatted + currency + secretHash).toUpperCase();
  return hash;
};

export const verifyPayHereCallback = (params) => {
  const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig } = params;
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
  const secretHash = md5(merchantSecret).toUpperCase();
  const local_md5sig = md5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + secretHash).toUpperCase();
  return local_md5sig === md5sig;
};
