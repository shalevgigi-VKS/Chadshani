import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import { UserId } from '../constants/types';

/**
 * Uploads an image or PDF to Firebase Storage.
 * Returns the public download URL.
 */
export async function uploadDocument(
  uri: string,
  userId: UserId,
  fileType: 'image' | 'pdf',
): Promise<string> {
  const ext      = fileType === 'pdf' ? 'pdf' : 'jpg';
  const filename = `documents/${userId}_${Date.now()}.${ext}`;
  const storageRef = ref(storage, filename);

  const response = await fetch(uri);
  const blob     = await response.blob();

  await uploadBytes(storageRef, blob, {
    contentType: fileType === 'pdf' ? 'application/pdf' : 'image/jpeg',
  });

  return getDownloadURL(storageRef);
}
