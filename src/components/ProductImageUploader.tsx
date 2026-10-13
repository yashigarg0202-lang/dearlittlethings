'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';

export interface UploadedImageItem {
  id?: string;
  url: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
  originalName?: string;
}

interface ProductImageUploaderProps {
  images: UploadedImageItem[];
  onChange: (images: UploadedImageItem[]) => void;
  productTitle?: string;
}

export default function ProductImageUploader({
  images,
  onChange,
  productTitle = 'Product',
}: ProductImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMsg('');
    setSuccessMsg('');
    setIsUploading(true);

    const validFiles: File[] = [];
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        setErrorMsg(`"${file.name}" is not a supported format. Please upload PNG, JPG, or WebP.`);
        setIsUploading(false);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg(`"${file.name}" exceeds the 10MB file size limit.`);
        setIsUploading(false);
        return;
      }
      validFiles.push(file);
    }

    setUploadProgress(`Uploading ${validFiles.length} file${validFiles.length > 1 ? 's' : ''}...`);

    try {
      const formData = new FormData();
      validFiles.forEach((file) => {
        formData.append('files', file);
      });

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload images');
      }

      const uploadedFiles: { url: string; originalName: string }[] = data.files || [];

      // Append new images to existing images
      const newImages: UploadedImageItem[] = [...images];
      const hasExistingPrimary = newImages.some((img) => img.isPrimary);

      uploadedFiles.forEach((f, idx) => {
        const isPrimary = !hasExistingPrimary && idx === 0 && newImages.length === 0;
        newImages.push({
          url: f.url,
          altText: productTitle.trim() || f.originalName,
          isPrimary,
          sortOrder: newImages.length,
          originalName: f.originalName,
        });
      });

      // Ensure at least one image is marked primary
      if (newImages.length > 0 && !newImages.some((img) => img.isPrimary)) {
        newImages[0].isPrimary = true;
      }

      onChange(newImages);
      setSuccessMsg(`Successfully uploaded ${uploadedFiles.length} image${uploadedFiles.length > 1 ? 's' : ''}!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setErrorMsg(message);
    } finally {
      setIsUploading(false);
      setUploadProgress('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleRemove = async (index: number) => {
    const targetImage = images[index];
    const updated = images.filter((_, i) => i !== index);

    // If we removed the primary image, mark the first remaining image as primary
    if (targetImage.isPrimary && updated.length > 0) {
      updated[0].isPrimary = true;
    }

    // Recalculate sortOrder
    const reindexed = updated.map((img, i) => ({ ...img, sortOrder: i }));
    onChange(reindexed);

    // If it was a newly uploaded image, we can opportunistically delete it from storage
    if (
      targetImage.url.startsWith('/uploads/products/') ||
      targetImage.url.includes('/storage/v1/object/public/product-images/')
    ) {
      try {
        await fetch(`/api/admin/upload?url=${encodeURIComponent(targetImage.url)}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.warn('Could not remove file from storage:', err);
      }
    }
  };

  const handleSetPrimary = (index: number) => {
    const updated = images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    onChange(updated);
  };

  const handleMove = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const copy = [...images];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    const reindexed = copy.map((img, i) => ({ ...img, sortOrder: i }));
    onChange(reindexed);
  };

  const handleAltChange = (index: number, alt: string) => {
    const copy = [...images];
    copy[index] = { ...copy[index], altText: alt };
    onChange(copy);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Notifications */}
      {errorMsg && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--accent-terracotta-soft, #fdf0ed)',
            border: '1px solid var(--accent-terracotta, #a85a44)',
            color: 'var(--accent-terracotta, #a85a44)',
            fontSize: '0.85rem',
            borderRadius: '4px',
          }}
        >
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#edf7ed',
            border: '1px solid #7cb342',
            color: '#33691e',
            fontSize: '0.85rem',
            borderRadius: '4px',
          }}
        >
          {successMsg}
        </div>
      )}

      {/* Upload Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: isDragging ? '2px dashed var(--primary, #a85a44)' : '2px dashed var(--border, #e2d7cc)',
          backgroundColor: isDragging ? 'var(--secondary, #ede4da)' : 'var(--background, #faf7f2)',
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
          borderRadius: '6px',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
          disabled={isUploading}
        />

        {/* Upload Icon */}
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'var(--muted, #f0eae2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary, #a85a44)',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
            <circle cx="9" cy="9" r="2"/>
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
          </svg>
        </div>

        <div>
          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--foreground, #3a2b24)', marginBottom: '0.2rem' }}>
            {isUploading ? uploadProgress : 'Upload Product Images from MacBook'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground, #7c6d63)' }}>
            Drag and drop images here, or{' '}
            <span style={{ color: 'var(--primary, #a85a44)', textDecoration: 'underline', fontWeight: 500 }}>
              browse files
            </span>
          </div>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #8f8075)' }}>
          Supported: PNG, JPG, JPEG, WebP (up to 10MB per image). Multiple uploads supported.
        </div>
      </div>

      {/* Gallery of Uploaded Images */}
      {images.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--foreground, #3a2b24)' }}>
              Product Gallery ({images.length} image{images.length > 1 ? 's' : ''})
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground, #7c6d63)' }}>
              ★ Star = Primary thumbnail shown on storefront & cart
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '1rem',
            }}
          >
            {images.map((img, index) => (
              <div
                key={img.id || `${img.url}-${index}`}
                style={{
                  position: 'relative',
                  backgroundColor: 'var(--bg-surface, #f5efeb)',
                  border: img.isPrimary ? '2px solid var(--primary, #a85a44)' : '1px solid var(--border, #e2d7cc)',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Image Preview Container */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '160px',
                    backgroundColor: 'var(--muted, #f0eae2)',
                  }}
                >
                  <img
                    src={img.url}
                    alt={img.altText || `Product image ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />

                  {/* Primary Badge */}
                  {img.isPrimary && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '6px',
                        left: '6px',
                        backgroundColor: 'var(--primary, #a85a44)',
                        color: '#fff',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '3px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      ★ Main Thumbnail
                    </div>
                  )}

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    title="Remove Image"
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      backgroundColor: 'rgba(58, 43, 36, 0.8)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      lineHeight: 1,
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#b33927')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(58, 43, 36, 0.8)')}
                  >
                    ✕
                  </button>
                </div>

                {/* Controls and Metadata */}
                <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {/* Reorder Buttons & Primary Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => handleMove(index, 'left')}
                        disabled={index === 0}
                        title="Move Left / Earlier"
                        style={{
                          padding: '3px 8px',
                          fontSize: '0.75rem',
                          backgroundColor: index === 0 ? 'var(--muted, #f0eae2)' : 'var(--background, #faf7f2)',
                          border: '1px solid var(--border, #e2d7cc)',
                          cursor: index === 0 ? 'not-allowed' : 'pointer',
                          color: index === 0 ? 'var(--text-muted)' : 'var(--foreground)',
                          borderRadius: '3px',
                        }}
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(index, 'right')}
                        disabled={index === images.length - 1}
                        title="Move Right / Later"
                        style={{
                          padding: '3px 8px',
                          fontSize: '0.75rem',
                          backgroundColor: index === images.length - 1 ? 'var(--muted, #f0eae2)' : 'var(--background, #faf7f2)',
                          border: '1px solid var(--border, #e2d7cc)',
                          cursor: index === images.length - 1 ? 'not-allowed' : 'pointer',
                          color: index === images.length - 1 ? 'var(--text-muted)' : 'var(--foreground)',
                          borderRadius: '3px',
                        }}
                      >
                        →
                      </button>
                    </div>

                    {!img.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(index)}
                        style={{
                          fontSize: '0.72rem',
                          padding: '3px 6px',
                          backgroundColor: 'transparent',
                          border: '1px solid var(--border, #e2d7cc)',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          color: 'var(--primary, #a85a44)',
                        }}
                      >
                        Set Main
                      </button>
                    )}
                  </div>

                  {/* Alt Text Input */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--muted-foreground)', marginBottom: '2px' }}>
                      Alt description:
                    </label>
                    <input
                      type="text"
                      value={img.altText}
                      onChange={(e) => handleAltChange(index, e.target.value)}
                      placeholder="Image description..."
                      style={{
                        width: '100%',
                        fontSize: '0.75rem',
                        padding: '4px 6px',
                        backgroundColor: 'var(--background, #faf7f2)',
                        border: '1px solid var(--border, #e2d7cc)',
                        borderRadius: '3px',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
