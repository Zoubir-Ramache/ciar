import { v2 as cloudinary } from 'cloudinary';
import { config } from './config';
import { CloudinaryAssetResource } from '@/types';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
  secure: true,
});

export const ROOT_TAG = 'ciar_app';

export async function uploadStreamToCloudinary(
  fileStream: NodeJS.ReadableStream,
  metadata: {
    originalFilename: string;
    carLabel?: string;
    senderId?: number;
    senderName?: string;
    uploadDateTag: string;
  }
): Promise<any> {
  const tags = [ROOT_TAG, metadata.uploadDateTag];
  if (metadata.carLabel) {
    const slug = metadata.carLabel.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    tags.push(`car_${slug}`);
  }

  const contextData: Record<string, string> = {
    original_filename: metadata.originalFilename,
    uploaded_at: new Date().toISOString(),
  };
  if (metadata.senderId) {
    contextData.sender_id = String(metadata.senderId);
  }
  if (metadata.senderName) {
    contextData.sender_name = metadata.senderName;
  }
  if (metadata.carLabel) {
    contextData.car_label = metadata.carLabel;
  }

  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: 'ciar',
        resource_type: 'auto',
        tags,
        context: contextData,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    fileStream.pipe(upload);
  });
}

export async function listPhotos(): Promise<CloudinaryAssetResource[]> {
  const result = await cloudinary.search
    .expression(`tags:${ROOT_TAG}`)
    .with_field('context')
    .with_field('tags')
    .sort_by('created_at', 'desc')
    .max_results(200)
    .execute();

  return (result.resources || []) as CloudinaryAssetResource[];
}

export function sanitizeZipFilename(name: string): string {
  const clean = name
    .trim()
    .replace(/[^a-zA-Z0-9_\-\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_');
  return clean || 'ciar-photos';
}

export function generateZipDownloadUrl(publicIds: string[], zipName: string = 'ciar-photos'): string {
  const safeName = sanitizeZipFilename(zipName);
  return cloudinary.utils.download_zip_url({
    public_ids: publicIds,
    target_public_id: safeName,
    flatten_folders: true,
    resource_type: 'auto',
  });
}

/**
 * Updates or renames the car group label for an array of photo public_ids.
 */
export async function updateCarLabel(publicIds: string[], newLabel: string): Promise<void> {
  if (publicIds.length === 0) return;
  const cleanLabel = newLabel.trim();
  const slug = cleanLabel.toLowerCase().replace(/[^a-z0-9_-]/g, '_');

  // Update context custom metadata (Cloudinary expects "key=value" string format)
  await cloudinary.uploader.add_context(
    `car_label=${cleanLabel}`,
    publicIds
  );

  // Add the car tag
  await cloudinary.uploader.add_tag(`car_${slug}`, publicIds);
}

export async function deletePhotos(publicIds: string[]): Promise<void> {
  if (publicIds.length === 0) return;
  await cloudinary.api.delete_resources(publicIds);
}

export async function purgeOldPhotos(days: number): Promise<number> {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const searchResult = await cloudinary.search
    .expression(`tags:${ROOT_TAG} AND created_at < ${cutoffDate}`)
    .max_results(500)
    .execute();

  const resources: CloudinaryAssetResource[] = searchResult.resources || [];
  if (resources.length === 0) return 0;

  const publicIds = resources.map((r) => r.public_id);
  await cloudinary.api.delete_resources(publicIds);
  return publicIds.length;
}

export { cloudinary };
