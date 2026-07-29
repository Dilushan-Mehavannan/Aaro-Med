import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'src/data');
const DATA_FILE = path.join(DATA_DIR, 'local-db.json');

const initialDoctors = [
  {
    id: 'doctor-1',
    name: 'Dr. Priya Krishnan',
    specialty: 'General Medicine',
    specialization: 'Family Care',
    consultationMode: 'Hybrid',
    bookingFee: 100,
    consultationFee: 450,
    avatar: 'PK',
    rating: 4.8,
    totalConsultations: 150,
    isAvailable: true,
    bio: 'Experienced general physician focused on preventive care.',
  },
  {
    id: 'doctor-2',
    name: 'Dr. Rajesh Kumar',
    specialty: 'General Medicine',
    specialization: 'Chronic Care',
    consultationMode: 'Online',
    bookingFee: 100,
    consultationFee: 400,
    avatar: 'RK',
    rating: 4.6,
    totalConsultations: 120,
    isAvailable: true,
    bio: 'Focused on long-term management for diabetes and hypertension.',
  },
  {
    id: 'doctor-3',
    name: 'Dr. Anjali Singh',
    specialty: 'General Medicine',
    specialization: 'Adult Care',
    consultationMode: 'Physical',
    bookingFee: 120,
    consultationFee: 500,
    avatar: 'AS',
    rating: 4.9,
    totalConsultations: 200,
    isAvailable: true,
    bio: 'Known for detailed diagnosis and patient-friendly treatment plans.',
  },
  {
    id: 'doctor-4',
    name: 'Dr. Nadeesha Perera',
    specialty: 'Psychiatry',
    specialization: 'Anxiety, Depression',
    consultationMode: 'Online, Physical',
    bookingFee: 150,
    consultationFee: 550,
    avatar: 'NP',
    rating: 4.9,
    totalConsultations: 310,
    isAvailable: true,
    bio: 'Consultant psychiatrist with focus on anxiety and mood disorders.',
  },
  {
    id: 'doctor-5',
    name: 'Dr. Kavinda Fernando',
    specialty: 'Psychiatry',
    specialization: 'PTSD, Addiction',
    consultationMode: 'Online',
    bookingFee: 150,
    consultationFee: 520,
    avatar: 'KF',
    rating: 4.7,
    totalConsultations: 180,
    isAvailable: true,
    bio: 'Supports trauma recovery and substance-use intervention programs.',
  },
];

const initialDb = {
  users: [],
  tokens: [],
  prescriptions: [],
  doctorSettings: {},
  doctors: initialDoctors,
  payments: [],
  feedback: [],
  issueReports: [],
};

const ensureDbFile = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
  }
};

export const readDb = async () => {
  await ensureDbFile();
  const content = await fs.readFile(DATA_FILE, 'utf-8');
  const parsed = JSON.parse(content);
  return {
    ...initialDb,
    ...parsed,
  };
};

export const writeDb = async (data) => {
  await ensureDbFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
};

export const updateDb = async (updater) => {
  const db = await readDb();
  const updated = await updater(db);
  await writeDb(updated);
  return updated;
};

export const createId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
