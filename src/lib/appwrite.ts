import { Client, Storage, ID } from 'appwrite';

const client = new Client();

if (!process.env.NEXT_PUBLIC_APPWRITE_PUBLIC_ENDPOINT || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
  throw new Error('Appwrite environment variables are not defined');
}
client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_PUBLIC_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

const storage = new Storage(client);

export { storage, ID };


export async function uploadFile( file: File) {
  const bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!;
  try {
    const uploadedFile = await storage.createFile(
      bucketId,
      ID.unique(),
      file,
    );
   
    const fileUrl = await storage.getFileView(bucketId, uploadedFile.$id);

    return fileUrl.toString(); // Return the file URL as a string
  } catch (error) {
    console.error('File upload failed:', error);
    throw error;
  }
}

export async function deleteFile(fileUrl: string) {
  const bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!;
  if (!bucketId) {
    throw new Error('Appwrite storage bucket ID is not defined');
  }
  const urlParts = fileUrl.split('/');
  // The file ID is the part right after 'files' in the URL.
  const filesIndex = urlParts.indexOf('files');
  const fileId = filesIndex !== -1 ? urlParts[filesIndex + 1] : null;
  
  if (!fileId) {
    throw new Error('Invalid file URL: could not extract file ID.');
  }

  try {
    await storage.deleteFile(bucketId, fileId);
    console.log(`File with ID ${fileId} deleted successfully.`);
  } catch (error) {
    console.error(`File deletion failed for ID ${fileId}:`, error);
    throw error;
  }
}