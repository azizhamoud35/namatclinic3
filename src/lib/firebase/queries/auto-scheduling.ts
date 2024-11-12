import { collection, query, where, getDocs, doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../config";
import { scheduleCustomer } from "./scheduling";
import { toast } from "sonner";

export async function toggleAutoScheduling(enabled: boolean) {
  try {
    await setDoc(doc(db, 'settings', 'autoScheduling'), {
      enabled,
      updatedAt: new Date()
    });
    return true;
  } catch (error) {
    console.error('Error toggling auto-scheduling:', error);
    throw error;
  }
}

export async function getAutoSchedulingStatus() {
  try {
    const docRef = doc(db, 'settings', 'autoScheduling');
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data().enabled : false;
  } catch (error) {
    console.error('Error getting auto-scheduling status:', error);
    throw error;
  }
}

export async function runAutoScheduling() {
  try {
    // Get all customers without upcoming appointments
    const customersRef = collection(db, 'users');
    const q = query(customersRef, where('role', '==', 'customer'));
    const snapshot = await getDocs(q);
    const customers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    let scheduledCount = 0;
    for (const customer of customers) {
      toast.info(`Checking appointments for ${customer.firstName} ${customer.lastName}`);
      const scheduled = await scheduleCustomer(customer.id);
      if (scheduled) {
        scheduledCount++;
        toast.success(`Appointment scheduled for ${customer.firstName} ${customer.lastName}`);
      }
    }

    return scheduledCount;
  } catch (error) {
    console.error('Error in auto-scheduling:', error);
    throw error;
  }
}