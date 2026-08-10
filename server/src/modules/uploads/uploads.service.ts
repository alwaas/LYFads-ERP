import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import {
  createClient,
  SupabaseClient,
} from '@supabase/supabase-js';

@Injectable()
export class UploadsService {
  private readonly supabase: SupabaseClient;
  private readonly bucket: string;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;

    const supabaseKey =
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      throw new Error(
        'SUPABASE_URL is required.',
      );
    }

    if (!supabaseKey) {
      throw new Error(
        'SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY is required.',
      );
    }

    this.bucket =
      process.env.SUPABASE_STORAGE_BUCKET ||
      'attachments';

    this.supabase = createClient(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },

        global: {
          headers: {
            Authorization: `Bearer ${supabaseKey}`,
          },
        },
      },
    );
  }

  async uploadFile(
    file: Express.Multer.File,
    folder = 'general',
  ) {
    if (!file) {
      throw new BadRequestException(
        'File is required.',
      );
    }

    if (!file.buffer) {
      throw new BadRequestException(
        'Uploaded file buffer is missing.',
      );
    }

    const safeOriginalName = file.originalname
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_');

    const fileName =
      `${Date.now()}-` +
      `${Math.round(Math.random() * 1e9)}-` +
      safeOriginalName;

    const cleanFolder = folder
      .replace(/^\/+|\/+$/g, '')
      .replace(/[^a-zA-Z0-9/_-]/g, '_');

    const filePath = cleanFolder
      ? `${cleanFolder}/${fileName}`
      : fileName;

    try {
      const { data: bucketData, error: bucketError } =
        await this.supabase.storage.getBucket(
          this.bucket,
        );

      if (bucketError || !bucketData) {
        console.error(
          'Supabase bucket check failed:',
          bucketError,
        );

        throw new InternalServerErrorException(
          `Storage bucket "${this.bucket}" is not available.`,
        );
      }

      const { error: uploadError } =
        await this.supabase.storage
          .from(this.bucket)
          .upload(
            filePath,
            file.buffer,
            {
              contentType: file.mimetype,
              cacheControl: '3600',
              upsert: false,
            },
          );

      if (uploadError) {
        console.error(
          'Supabase storage upload failed:',
          uploadError,
        );

        throw new InternalServerErrorException(
          'Failed to upload file to storage.',
        );
      }

      const { data: publicData } =
        this.supabase.storage
          .from(this.bucket)
          .getPublicUrl(filePath);

      if (!publicData?.publicUrl) {
        console.error(
          'Supabase public URL generation failed.',
        );

        throw new InternalServerErrorException(
          'Failed to generate file URL.',
        );
      }

      return {
        fileName,
        originalName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        filePath,
        fileUrl: publicData.publicUrl,
      };
    } catch (error) {
      if (
        error instanceof
        InternalServerErrorException
      ) {
        throw error;
      }

      console.error(
        'Unexpected Supabase upload error:',
        error,
      );

      throw new InternalServerErrorException(
        'Failed to upload file.',
      );
    }
  }

  async deleteFile(filePath: string) {
    if (!filePath) {
      throw new BadRequestException(
        'File path is required.',
      );
    }

    try {
      const { error } =
        await this.supabase.storage
          .from(this.bucket)
          .remove([filePath]);

      if (error) {
        console.error(
          'Supabase storage delete failed:',
          error,
        );

        throw new InternalServerErrorException(
          'Failed to delete file from storage.',
        );
      }

      return {
        success: true,
        message: 'File deleted successfully.',
      };
    } catch (error) {
      if (
        error instanceof
        InternalServerErrorException
      ) {
        throw error;
      }

      console.error(
        'Unexpected Supabase delete error:',
        error,
      );

      throw new InternalServerErrorException(
        'Failed to delete file.',
      );
    }
  }
}
