import { generateUploadButton, generateUploadDropzone } from '@uploadthing/react';

/**
 * NOTE: This file is copied from:
 * https://docs.uploadthing.com/getting-started/appdir#create-the-upload-thing-components
 */

import type { OurFileRouter } from '@/app/api/uploadthing/core';

export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();
