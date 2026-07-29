import { createId, readDb, updateDb } from '../services/localDb.js';

// Initiate PayHere payment
export const initiatePayment = async (req, res, next) => {
  try {
    const { tokenId, paymentType } = req.body; // paymentType: 'booking' | 'consultation'

    if (!tokenId || !paymentType) {
      return res.status(400).json({ error: 'tokenId and paymentType are required' });
    }

    const db = await readDb();
    const token = db.tokens.find((t) => t.id === tokenId);
    if (!token) return res.status(404).json({ error: 'Token not found' });
    if (token.patientId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const amount = paymentType === 'booking' ? token.bookingFee : token.consultationFee;
    const paymentId = createId('pay');

    // Build PayHere checkout params (merchant signs these server-side in production)
    const merchant_id = process.env.PAYHERE_MERCHANT_ID || 'DEMO_MERCHANT';
    const return_url = process.env.PAYHERE_RETURN_URL || 'http://localhost:3000/payment/success';
    const cancel_url = process.env.PAYHERE_CANCEL_URL || 'http://localhost:3000/payment/cancel';
    const notify_url = process.env.PAYHERE_NOTIFY_URL || 'http://localhost:5000/api/payments/notify';

    const paymentRecord = {
      id: paymentId,
      tokenId,
      patientId: req.user.id,
      doctorId: token.doctorId,
      paymentType,
      amount,
      currency: 'LKR',
      status: 'pending',
      payHereOrderId: paymentId,
      createdAt: new Date().toISOString(),
    };

    await updateDb((current) => ({
      ...current,
      payments: [...(current.payments || []), paymentRecord],
    }));

    res.json({
      message: 'Payment initiated',
      payment: paymentRecord,
      payhereParams: {
        merchant_id,
        return_url,
        cancel_url,
        notify_url,
        order_id: paymentId,
        items: `MediToken - ${paymentType === 'booking' ? 'Booking Fee' : 'Consultation Fee'}`,
        currency: 'LKR',
        amount: amount.toFixed(2),
        first_name: req.user.name?.split(' ')[0] || 'Patient',
        last_name: req.user.name?.split(' ')[1] || '',
        email: req.user.email,
        phone: '',
        address: '',
        city: '',
        country: 'Sri Lanka',
        sandbox: true, // set false in production
      },
    });
  } catch (error) {
    next(error);
  }
};

// PayHere async payment notification (IPN)
export const handlePayHereNotify = async (req, res, next) => {
  try {
    const { order_id, status_code, payment_id } = req.body;
    // status_code 2 = success, -1 = canceled, -2 = failed, -3 = chargeback
    const isSuccess = status_code === '2';

    await updateDb((current) => {
      const payments = (current.payments || []).map((p) => {
        if (p.id !== order_id) return p;
        return {
          ...p,
          status: isSuccess ? 'completed' : 'failed',
          payherePaymentId: payment_id,
          updatedAt: new Date().toISOString(),
        };
      });

      // Also update the token payment status
      let tokens = current.tokens;
      if (isSuccess) {
        const payment = (current.payments || []).find((p) => p.id === order_id);
        if (payment) {
          tokens = current.tokens.map((t) => {
            if (t.id !== payment.tokenId) return t;
            return {
              ...t,
              paymentStatus: payment.paymentType === 'booking' ? 'booking_paid' : 'fully_paid',
              updatedAt: new Date().toISOString(),
            };
          });
        }
      }

      return { ...current, payments, tokens };
    });

    res.send('OK');
  } catch (error) {
    next(error);
  }
};

// Mark payment completed manually (for demo/cash)
export const markPaymentComplete = async (req, res, next) => {
  try {
    const { tokenId, paymentType } = req.body;

    const db = await readDb();
    const token = db.tokens.find((t) => t.id === tokenId);
    if (!token) return res.status(404).json({ error: 'Token not found' });

    const paymentId = createId('pay');
    const amount = paymentType === 'booking' ? token.bookingFee : token.consultationFee;

    await updateDb((current) => ({
      ...current,
      payments: [
        ...(current.payments || []),
        {
          id: paymentId,
          tokenId,
          patientId: token.patientId,
          doctorId: token.doctorId,
          paymentType,
          amount,
          currency: 'LKR',
          status: 'completed',
          method: 'manual',
          createdAt: new Date().toISOString(),
        },
      ],
      tokens: current.tokens.map((t) => {
        if (t.id !== tokenId) return t;
        return {
          ...t,
          paymentStatus: paymentType === 'booking' ? 'booking_paid' : 'fully_paid',
          updatedAt: new Date().toISOString(),
        };
      }),
    }));

    res.json({ message: 'Payment marked as completed', paymentId });
  } catch (error) {
    next(error);
  }
};

// Get payment history for current user
export const getMyPayments = async (req, res, next) => {
  try {
    const db = await readDb();
    const payments = (db.payments || []).filter((p) => p.patientId === req.user.id);
    res.json(payments);
  } catch (error) {
    next(error);
  }
};

// Admin: get all payments
export const getAllPayments = async (req, res, next) => {
  try {
    const db = await readDb();
    res.json(db.payments || []);
  } catch (error) {
    next(error);
  }
};
