import { generateUploadButton, generateUploadDropzone } from '@uploadthing/react';

import type { OurFileRouter } from '@/app/api/uploadthing/core';

/**
 * NOTE: This file is copied from:
 * {@link https://docs.uploadthing.com/getting-started/appdir#create-the-upload-thing-components}
 */

export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();
