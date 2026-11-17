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

  // Generate a clean day-based public_id: YYYY-MM-DD_Car_HHhMMmSSs_random
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const timeStr = `${pad(now.getHours())}h${pad(now.getMinutes())}m${pad(now.getSeconds())}`;
  const carSlug = metadata.carLabel ? `${metadata.carLabel.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}_` : '';
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  const publicId = `${dateStr}_${carSlug}${timeStr}_${randomSuffix}`;

  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: 'ciar',
        public_id: publicId,
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

export function getFriendlyPhotoFilename(photo: CloudinaryAssetResource): string {
  const dateStr = photo.context?.uploaded_at || photo.created_at || new Date().toISOString();
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());

  const datePart = `${year}-${month}-${day}`;
  const timePart = `${hours}h${minutes}m${seconds}s`;

  const car = photo.context?.car_label?.trim() || photo.context?.custom?.car_label?.trim();
  const carPart = car ? `_${car.replace(/[^a-zA-Z0-9_-]/g, '_')}` : '';
  const ext = (photo.format || 'jpg').replace(/^\./, '');

  return `${datePart}${carPart}_${timePart}.${ext}`;
}

export function generateZipDownloadUrl(publicIds: string[], zipName: string = 'ciar-photos'): string {
  const safeName = sanitizeZipFilename(zipName);
  return cloudinary.utils.download_zip_url({
    public_ids: publicIds,
    target_public_id: safeName,
    flatten_folders: true,
    resource_type: 'image',
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
