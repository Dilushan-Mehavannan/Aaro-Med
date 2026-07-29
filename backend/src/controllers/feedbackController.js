import { createId, readDb, updateDb } from '../services/localDb.js';

// Patient submits a rating for a doctor after consultation
export const submitFeedback = async (req, res, next) => {
  try {
    const { doctorId, tokenId, rating, comment, reportIssue, issueType } = req.body;

    if (!doctorId || !rating) {
      return res.status(400).json({ error: 'doctorId and rating are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const db = await readDb();

    // Verify the token belongs to this patient (if tokenId provided)
    if (tokenId) {
      const token = db.tokens.find((t) => t.id === tokenId && t.patientId === req.user.id);
      if (!token) return res.status(403).json({ error: 'Invalid token or access denied' });
    }

    // Check duplicate feedback per token
    if (tokenId) {
      const existing = (db.feedback || []).find((f) => f.tokenId === tokenId);
      if (existing) return res.status(409).json({ error: 'Feedback already submitted for this consultation' });
    }

    const feedback = {
      id: createId('feedback'),
      doctorId,
      tokenId: tokenId || null,
      patientId: req.user.id,
      patientName: req.user.name || 'Anonymous',
      rating: Number(rating),
      comment: comment || '',
      reportIssue: !!reportIssue,
      issueType: issueType || null, // 'video' | 'audio' | 'connection' | 'other'
      createdAt: new Date().toISOString(),
    };

    await updateDb((current) => {
      // Recalculate doctor average rating
      const allFeedback = [...(current.feedback || []), feedback].filter((f) => f.doctorId === doctorId);
      const avgRating = allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length;

      return {
        ...current,
        feedback: [...(current.feedback || []), feedback],
        doctors: current.doctors.map((d) =>
          d.id === doctorId
            ? { ...d, rating: Math.round(avgRating * 10) / 10, reviews: allFeedback.length }
            : d
        ),
      };
    });

    res.status(201).json({ message: 'Feedback submitted successfully', feedback });
  } catch (error) {
    next(error);
  }
};

// Get feedback for a specific doctor (public)
export const getDoctorFeedback = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const db = await readDb();
    const feedback = (db.feedback || [])
      .filter((f) => f.doctorId === doctorId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((f) => ({
        id: f.id,
        rating: f.rating,
        comment: f.comment,
        patientName: f.patientName,
        createdAt: f.createdAt,
      }));
    res.json(feedback);
  } catch (error) {
    next(error);
  }
};

// Doctor submits a system issue report
export const submitIssueReport = async (req, res, next) => {
  try {
    const { issueType, description, tokenId } = req.body;

    if (!issueType || !description) {
      return res.status(400).json({ error: 'issueType and description are required' });
    }

    const report = {
      id: createId('issue'),
      reportedBy: req.user.id,
      reporterRole: req.user.role,
      reporterName: req.user.name,
      issueType,
      description,
      tokenId: tokenId || null,
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    await updateDb((current) => ({
      ...current,
      issueReports: [...(current.issueReports || []), report],
    }));

    res.status(201).json({ message: 'Issue report submitted', report });
  } catch (error) {
    next(error);
  }
};

// Admin: get all feedback and issue reports
export const getAllFeedback = async (req, res, next) => {
  try {
    const db = await readDb();
    res.json({
      feedback: db.feedback || [],
      issueReports: db.issueReports || [],
    });
  } catch (error) {
    next(error);
  }
};
