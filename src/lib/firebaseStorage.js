import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, app } from '../config/firebase';

const storage = getStorage(app);

/**
 * Uploads a file to Firebase Storage and returns its download URL.
 * @param {File|Blob} file - The file to upload.
 * @param {string} path - The path in storage (e.g., 'jobs/uuid/protein.pdb').
 * @returns {Promise<string>} The download URL.
 */
export const uploadJobFile = async (file, path) => {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
};

/**
 * Saves a job's metadata to Firestore.
 * @param {Object} jobData - Metadata including name, fasta, urls, etc.
 * @returns {Promise<string>} The document ID.
 */
export const saveJobMetadata = async (jobData) => {
  try {
    const docRef = await addDoc(collection(db, 'jobs_history'), {
      ...jobData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving job metadata:', error);
    throw error;
  }
};

/**
 * Fetches all jobs for a specific user.
 * @param {string} userId - The unique user ID.
 * @returns {Promise<Array>} List of jobs.
 */
export const getUserJobs = async (userId) => {
  try {
    const q = query(
      collection(db, 'jobs_history'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching user jobs:', error);
    throw error;
  }
};
