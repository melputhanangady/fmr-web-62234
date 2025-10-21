import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { User } from '../types';

/**
 * Check if the current user is an admin
 */
export const isAdmin = async (userId: string): Promise<boolean> => {
  try {
    if (!userId) return false;

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) return false;
    
    const userData = userDoc.data() as User;
    return userData.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Check if the current user is an admin (synchronous version using cached data)
 */
export const isAdminSync = (userData: User | null): boolean => {
  if (!userData) return false;
  return userData.role === 'admin';
};

/**
 * Get admin users list (for super admin operations)
 */
export const getAdminUsers = async (): Promise<User[]> => {
  try {
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const usersRef = collection(db, 'users');
    const adminQuery = query(usersRef, where('role', '==', 'admin'));
    const adminSnapshot = await getDocs(adminQuery);
    
    return adminSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as User[];
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return [];
  }
};
