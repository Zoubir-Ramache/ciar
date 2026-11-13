export interface TelegramUser {
  id: number;
  first_name: string;
  username?: string;
}

export interface TelegramPhotoSize {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
}

export interface TelegramDocument {
  file_id: string;
  file_unique_id: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  date: number;
  chat: { id: number; type: string };
  text?: string;
  caption?: string;
  photo?: TelegramPhotoSize[];
  document?: TelegramDocument;
  media_group_id?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

export interface CloudinaryAssetResource {
  public_id: string;
  format: string;
  bytes: number;
  created_at: string;
  secure_url: string;
  context?: {
    original_filename?: string;
    car_label?: string;
    uploaded_at?: string;
    sender_id?: string;
    custom?: {
      original_filename?: string;
      car_label?: string;
      uploaded_at?: string;
      sender_id?: string;
    };
  };
  tags: string[];
}
