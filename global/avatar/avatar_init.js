/**
 * avatar_init.js
 * Avatar upload component - reusable across all modules
 * Usage: setupAvatarUpload(placeholderId, fileInputId)
 */

function setupAvatarUpload(placeholderId, fileInputId) {
  const avatarPlaceholder = document.getElementById(placeholderId);
  const fileInput = document.getElementById(fileInputId);
  const plusBtn = document.getElementById('avatar-plus-btn');
  const chooseBtn = document.getElementById('avatar-choose-btn');
  const avatarButtonText = document.getElementById('avatar-button-text');
  const avatarPreview = document.getElementById('avatar-preview');
  
  if (!avatarPlaceholder || !fileInput || !plusBtn || !chooseBtn) {
    console.error('Avatar upload: Missing required elements');
    return;
  }

  let isActive = false;

  // Translate button text if translation function exists
  if (avatarButtonText && typeof getString === 'function') {
    avatarButtonText.textContent = getString('onboarding.avatar.fileButton');
  }
  
  console.log('Avatar component initialized');

  // Plus button: expand
  plusBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    isActive = true;
    plusBtn.style.display = 'none';
    chooseBtn.style.display = 'flex';
  });

  // Choose File button: open file picker
  chooseBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fileInput.click();
  });

  // Avatar placeholder: expand/contract
  avatarPlaceholder.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isActive) {
      // Expand
      isActive = true;
      plusBtn.style.display = 'none';
      chooseBtn.style.display = 'flex';
    } else {
      // Contract
      isActive = false;
      plusBtn.style.display = 'flex';
      chooseBtn.style.display = 'none';
    }
  });

  // Handle file selection
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        avatarPreview.src = dataUrl;
        avatarPreview.style.display = 'block';

        // Hide placeholder SVG
        const placeholderSvg = avatarPlaceholder.querySelector('svg');
        if (placeholderSvg) placeholderSvg.style.display = 'none';

        // Contract button
        isActive = false;
        plusBtn.style.display = 'flex';
        chooseBtn.style.display = 'none';

        // Update in-memory preview only (do not dispatch avatarUpdated).
        // Consumers (toolbar, menus) will be synced when the user saves.
        if (window && window.AvatarStore && typeof window.AvatarStore.setPreview === 'function') {
          try { window.AvatarStore.setPreview(dataUrl); } catch (err) { console.warn('AvatarStore.setPreview failed', err); }
        }
      };
      reader.readAsDataURL(file);
    }
  });

  // Drag and drop
  avatarPlaceholder.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    avatarPlaceholder.style.background = 'var(--color-bg)';
    avatarPlaceholder.style.borderColor = 'var(--color-secondary)';
    avatarPlaceholder.style.borderStyle = 'dashed';
    avatarPlaceholder.style.borderWidth = '3px';
    
    // Hide preview during drag
    if (avatarPreview.style.display !== 'none') {
      avatarPreview.style.display = 'none';
    }
  });

  avatarPlaceholder.addEventListener('dragleave', (e) => {
    if (e.target === avatarPlaceholder) {
      e.preventDefault();
      e.stopPropagation();
      avatarPlaceholder.style.background = 'var(--color-bg)';
      avatarPlaceholder.style.borderColor = 'var(--color-border-dark)';
      avatarPlaceholder.style.borderStyle = 'solid';
      avatarPlaceholder.style.borderWidth = 'var(--border-width)';
      
      // Restore preview if it exists
      if (avatarPreview.src) {
        avatarPreview.style.display = 'block';
      }
    }
  });

  avatarPlaceholder.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    avatarPlaceholder.style.background = 'var(--color-bg)';
    avatarPlaceholder.style.borderColor = 'var(--color-border-dark)';
    avatarPlaceholder.style.borderStyle = 'solid';
    avatarPlaceholder.style.borderWidth = 'var(--border-width)';

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target.result;
          avatarPreview.src = dataUrl;
          avatarPreview.style.display = 'block';

          // Hide placeholder SVG
          const placeholderSvg = avatarPlaceholder.querySelector('svg');
          if (placeholderSvg) placeholderSvg.style.display = 'none';

          // Contract button
          isActive = false;
          plusBtn.style.display = 'flex';
          chooseBtn.style.display = 'none';

          // Update in-memory preview only (do not dispatch avatarUpdated).
          if (window && window.AvatarStore && typeof window.AvatarStore.setPreview === 'function') {
            try { window.AvatarStore.setPreview(dataUrl); } catch (err) { console.warn('AvatarStore.setPreview failed', err); }
          }
        };
        reader.readAsDataURL(file);
      }
    }
  });

  // If there's an avatar already in memory, show it immediately
  if (window && window.AvatarStore && typeof window.AvatarStore.getImage === 'function') {
    const current = window.AvatarStore.getImage();
    if (current) {
      avatarPreview.src = current;
      avatarPreview.style.display = 'block';
      const placeholderSvg = avatarPlaceholder.querySelector('svg');
      if (placeholderSvg) placeholderSvg.style.display = 'none';
    }
  }

  // Keep this placeholder in sync when the shared AvatarStore changes.
  // Listen on window so other modules that dispatch the event will be caught.
  try {
    window.addEventListener('avatarUpdated', (ev) => {
      const url = (ev && ev.detail && ev.detail.avatarUrl) || (window.AvatarStore && typeof window.AvatarStore.getImage === 'function' && window.AvatarStore.getImage());
      if (url) {
        avatarPreview.src = url;
        avatarPreview.style.display = 'block';
        const placeholderSvg = avatarPlaceholder.querySelector('svg');
        if (placeholderSvg) placeholderSvg.style.display = 'none';
      }
    });
  } catch (err) {
    console.warn('Failed to bind avatarUpdated listener for placeholder', err);
  }
}

// Global avatar store: central place to keep the currently loaded avatar image URL/data
if (!window.AvatarStore) {
  window.AvatarStore = {
    imageUrl: null,
    // Update the in-memory preview without notifying consumers. Use this
    // when the user changes the preview locally; consumers should only
    // be notified when the change is persisted (via `setImage`).
    setPreview(url) {
      this.imageUrl = url;
      try {
        // Notify listeners that the preview changed (does not mean it's persisted)
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('avatarPreviewChanged', { detail: { avatarUrl: url } }));
        }
      } catch (e) {
        // ignore
      }
    },
    setImage(url) {
      this.imageUrl = url;
      try {
        // Dispatch on window so most modules can listen for updates
        window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: { avatarUrl: url } }));
      } catch (e) {
        // ignore
      }
      try {
        // Some modules may listen on document; dispatch there as well for compatibility
        if (typeof document !== 'undefined' && document.dispatchEvent) {
          document.dispatchEvent(new CustomEvent('avatarUpdated', { detail: { avatarUrl: url } }));
        }
      } catch (e) {
        // ignore
      }
    },
    getImage() {
      return this.imageUrl;
    }
  };
}

/**
 * Generate initials from first and last name
 * Returns initials like "JD" for John Doe
 */
function getInitials(firstName, lastName) {
  const first = (firstName || '').trim().charAt(0).toUpperCase();
  const last = (lastName || '').trim().charAt(0).toUpperCase();
  return (first + last) || '';
}

/**
 * Create an initials avatar as a canvas image
 * Returns a data URL of a circular initials avatar
 * Color is selected based on initials (cycles through 10 colors)
 */
function createInitialsAvatar(firstName, lastName, size = 220) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = size;
  canvas.height = size;
  
  // Get color based on initials (deterministic, same initials = same color)
  const initials = getInitials(firstName, lastName);
  const firstCode = initials.charCodeAt(0) || 0;
  const secondCode = initials.charCodeAt(1) || 0;
  const colorIndex = Math.abs((firstCode + secondCode) % 10);

  // Read avatar palette  global_styles CSS variables --avatar-color-0..9
  const rootStyle = getComputedStyle(document.documentElement);
  const colors = [];
  for (let i = 0; i < 10; i++) {
    const v = rootStyle.getPropertyValue(`--rainbow-color-${i}`).trim();
    colors.push(v);
  }

  const backgroundColor = colors[colorIndex];
  
  // Background circle
  ctx.fillStyle = backgroundColor;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  
  // Text (initials) - prefer CSS tokens and do not include hardcoded fallbacks
  // (no hardcoded color literals in JS to satisfy the repo checks)
  const textColor = (
    rootStyle.getPropertyValue('--avatar-initials-text').trim() ||
    rootStyle.getPropertyValue('--font-color-light').trim() ||
    rootStyle.getPropertyValue('--font-color-bg').trim()
  );
  if (textColor) ctx.fillStyle = textColor;
  ctx.font = `bold ${size * 0.4}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, size / 2, size / 2);
  
  return canvas.toDataURL('image/png');
}

/**
 * Convert initials avatar to blob for upload
 */
function initialsAvatarToBlob(dataUrl) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        },
        'image/png',
        0.9
      );
    };
    img.onerror = () => reject(new Error('Failed to load initials image'));
    img.src = dataUrl;
  });
}

/**
 * Upload initials avatar to Supabase Storage
 */
async function uploadInitialsAvatarToSupabase(userId, firstName, lastName) {
  try {
    if (!window.supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Create initials avatar
    const initialsDataUrl = createInitialsAvatar(firstName, lastName, 220);
    const blob = await initialsAvatarToBlob(initialsDataUrl);
    // File path: public/filename (matches RLS policy for public folder)
    const filePath = `public/${userId}-initials-${Date.now()}.png`;

    // Upload to Supabase Storage
    const { data, error } = await window.supabase.storage
      .from('avatars')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: publicUrl } = window.supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return publicUrl.publicUrl;
  } catch (error) {
    console.error('Initials avatar upload error:', error);
    throw error;
  }
}

/**
 * Compress avatar preview to canvas and convert to blob
 * Resizes to 220px × 220px and compresses quality
 */
async function compressAvatarPreview() {
  const avatarPreview = document.getElementById('avatar-preview');
  
  if (!avatarPreview || !avatarPreview.src) {
    throw new Error('No avatar preview found');
  }

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const size = 220; // Size for the avatar

    canvas.width = size;
    canvas.height = size;

    // Create image to draw on canvas
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Crop the image to a centered square so we preserve the same
      // center-cropped preview the user saw before saving.
      const iw = img.width;
      const ih = img.height;
      let sx = 0, sy = 0, sw = iw, sh = ih;

      if (iw > ih) {
        // image is wider than tall -> take centered square of height
        sw = ih;
        sh = ih;
        sx = Math.floor((iw - ih) / 2);
        sy = 0;
      } else if (ih > iw) {
        // image is taller than wide -> take centered square of width
        sw = iw;
        sh = iw;
        sx = 0;
        sy = Math.floor((ih - iw) / 2);
      }

      // Draw circular image on canvas (apply clipping after computing crop)
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();

      // Draw the center-cropped source into the destination square (0,0,size,size)
      // This preserves the preview composition instead of stretching the whole image.
      try {
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
      } catch (drawErr) {
        // Fallback: draw without cropping if something goes wrong
        console.warn('drawImage center-crop failed, falling back to default draw', drawErr);
        ctx.drawImage(img, 0, 0, size, size);
      }

      // Convert canvas to blob (PNG preserves transparency; JPEG can be used for smaller size)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress avatar'));
          }
        },
        'image/png',
        0.9
      );
    };
    img.onerror = () => reject(new Error('Failed to load avatar image'));
    img.src = avatarPreview.src;
  });
}

/**
 * Upload compressed avatar to Supabase Storage
 * Returns the public URL of the uploaded image
 */
async function uploadAvatarToSupabase(userId) {
  try {
    if (!window.supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Compress preview
    const blob = await compressAvatarPreview();
    // File path: public/filename (matches RLS policy for public folder)
    const filePath = `public/${userId}-avatar-${Date.now()}.png`;

    // Upload to Supabase Storage (avatars bucket)
    const { data, error } = await window.supabase.storage
      .from('avatars')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: publicUrl } = window.supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return publicUrl.publicUrl;
  } catch (error) {
    console.error('Avatar upload error:', error);
    throw error;
  }
}

// Expose upload helper globally so other modules can call it reliably.
try {
  if (typeof window !== 'undefined') window.uploadAvatarToSupabase = uploadAvatarToSupabase;
} catch (e) {
  // ignore in non-browser environments
}
