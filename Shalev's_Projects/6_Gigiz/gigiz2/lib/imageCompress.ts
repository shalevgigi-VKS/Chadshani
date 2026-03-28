import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Compresses an image for long-term storage.
 * ~3MB photo → ~150KB — readable quality, minimal storage cost.
 */
export async function compressForStorage(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }],
    { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG },
  );
  return result.uri;
}

/**
 * Compresses an image just for scanning (higher quality for AI accuracy).
 * Not saved — only used temporarily for Gemini scan.
 */
export async function compressForScan(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 2000 } }],
    { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
  );
  return result.uri;
}
