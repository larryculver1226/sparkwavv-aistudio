import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { updateProfile } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { userService } from './userService';

export const storageService = {
  async uploadProfileImage(
    file: File | Blob,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to upload a profile image.');
    }

    const fileExtension = file instanceof File ? file.name.split('.').pop() : 'jpg';
    const storageRef = ref(storage, `users/${user.uid}/profile.${fileExtension}`);

    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          console.error('Upload failed:', error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Update Firebase Auth profile
            await updateProfile(user, { photoURL: downloadURL });

            // Update Firestore user document
            const idToken = await user.getIdToken();
            await userService.updateProfile(idToken, { photoURL: downloadURL });

            resolve(downloadURL);
          } catch (error) {
            console.error('Failed to update profile with new image URL:', error);
            reject(error);
          }
        }
      );
    });
  },
  async uploadFeedbackAttachment(
    file: File | Blob,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      // Check file size (limit to 800KB to fit in Firestore document)
      const MAX_SIZE = 800 * 1024;
      if (file.size > MAX_SIZE) {
        return reject(new Error('File is too large. Maximum size is 800KB.'));
      }

      if (onProgress) {
        onProgress(50);
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (onProgress) {
          onProgress(100);
        }
        resolve(reader.result as string);
      };
      reader.onerror = (error) => {
        console.error('Failed to read file:', error);
        reject(new Error('Failed to read file for attachment'));
      };
      reader.readAsDataURL(file);
    });
  },
};
