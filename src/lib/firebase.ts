import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB5iBTjS3w-POPzBTlWSEyvph2X43NET2I",
  authDomain: "namat-clinic.firebaseapp.com",
  projectId: "namat-clinic",
  storageBucket: "namat-clinic.appspot.com",
  messagingSenderId: "392594971153",
  appId: "1:392594971153:web:334d410c74ac8f84106fb0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

interface AppointmentData {
  customerId: string;
  coachId: string;
  date: Date;
  status: string;
}

export async function createAppointment(data: AppointmentData) {
  return addDoc(collection(db, 'appointments'), {
    ...data,
    date: Timestamp.fromDate(data.date),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
}