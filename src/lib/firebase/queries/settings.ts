import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function getAutoSchedulingState() {
  const settingsDoc = await getDoc(doc(db, 'settings', 'autoScheduling'));
  return settingsDoc.exists() ? settingsDoc.data().enabled : false;
}

export async function setAutoSchedulingState(enabled: boolean) {
  await setDoc(doc(db, 'settings', 'autoScheduling'), {
    enabled,
    updatedAt: new Date()
  });
}