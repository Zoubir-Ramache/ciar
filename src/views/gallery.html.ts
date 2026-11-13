import { CloudinaryAssetResource } from '@/types';
import { cloudinary } from '@/lib/cloudinary';

export function renderGalleryPage(photos: CloudinaryAssetResource[], alertMsg?: string): string {
  const groups: Record<string, CloudinaryAssetResource[]> = {};
  const allPublicIds: string[] = [];

  for (const photo of photos) {
    allPublicIds.push(photo.public_id);
    const label = photo.context?.custom?.car_label?.trim();
    const dateStr = photo.created_at ? photo.created_at.substring(0, 10) : 'Recent';
    const groupKey = label ? label : `Uploaded on ${dateStr}`;

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(photo);
  }

  const groupKeys = Object.keys(groups);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ciar - Car Photos</title>
  <link rel="stylesheet" href="/css/legacy.css">
</head>
<body>
  <div class="header">
    <h1>Ciar Car Photos</h1>
    <div class="nav-links">
      <a href="/logout">Logout</a>
    </div>
  </div>

  <div class="container">
    ${alertMsg ? `<div class="alert alert-info">${escapeHtml(alertMsg)}</div>` : ''}

    <form method="POST" id="mainForm" action="/download-zip">
      <!-- Main Actions Bar -->
      <div class="action-bar">
        <div>
          <label style="margin-right:15px; font-weight:bold; cursor:pointer;">
            <input type="checkbox" id="selectAllCheckbox" style="vertical-align:middle;"> Select All (${photos.length})
          </label>
          <button type="submit" formaction="/download-zip" class="btn btn-primary">Download Selected as ZIP</button>
          <button type="submit" formaction="/delete" class="btn btn-danger" style="margin-left:8px;" onclick="return confirm('Are you sure you want to delete the selected photos?');">Delete Selected</button>
          
          <div style="float:right;">
            <button type="submit" formaction="/download-zip?mode=all" class="btn">Download ALL as ZIP</button>
          </div>
        </div>

        <!-- Car Group Assignment Bar -->
        <div class="grouping-bar">
          <label for="car_label" style="font-weight:bold; margin-right:8px;">Assign Car Name to Selected:</label>
          <input type="text" id="car_label" name="car_label" placeholder="e.g. Golf 7 or Audi A4" class="form-control" style="width:220px; display:inline-block; vertical-align:middle;">
          <button type="submit" formaction="/set-group" class="btn btn-success" style="margin-left:6px;">Group Selected Photos</button>
        </div>
      </div>

      ${
        photos.length === 0
          ? `<div class="card" style="text-align:center; padding:40px; color:#666;">
               <h3>No photos found</h3>
               <p>Send car photos to your Telegram bot. They will appear here immediately.</p>
             </div>`
          : groupKeys
              .map((groupTitle, groupIndex) => {
                const groupPhotos = groups[groupTitle];
                const isCarCaption = !groupTitle.startsWith('Uploaded on ');
                const icon = isCarCaption ? '🚗' : '📅';
                const safeGroupId = `grp_${groupIndex}`;

                return `
          <!-- Car Group Header -->
          <div class="group-header">
            <div class="group-title">
              ${icon} ${escapeHtml(groupTitle)} (${groupPhotos.length} photos)
            </div>
            <div class="group-actions">
              <!-- Select All in this Group -->
              <button type="button" class="btn" onclick="toggleGroup('${safeGroupId}')">Select This Car</button>
              <!-- 1-Click Group ZIP Download -->
              <a href="/download-zip?group=${encodeURIComponent(groupTitle)}" class="btn btn-primary" title="Download only this car photos as ZIP">
                Download ${escapeHtml(groupTitle)} (ZIP)
              </a>
            </div>
          </div>

          <div class="photo-grid" id="${safeGroupId}">
            ${groupPhotos
              .map((photo) => {
                const filename = photo.context?.custom?.original_filename || `${photo.public_id}.${photo.format}`;
                const sizeKb = Math.round(photo.bytes / 1024);
                const thumbUrl = cloudinary.url(photo.public_id, {
                  width: 320,
                  height: 240,
                  crop: 'fill',
                  quality: 'auto:good',
                  format: 'jpg',
                });
                const downloadUrl = cloudinary.url(photo.public_id, {
                  flags: 'attachment',
                  format: photo.format,
                });

                return `
              <div class="photo-item">
                <div class="photo-card">
                  <a href="${downloadUrl}" target="_blank">
                    <img src="${thumbUrl}" alt="${escapeHtml(filename)}" loading="lazy">
                  </a>
                  <div class="photo-meta" title="${escapeHtml(filename)}">
                    <strong>${escapeHtml(filename)}</strong><br>
                    ${sizeKb} KB
                  </div>
                  <div style="margin-bottom:8px;">
                    <label style="cursor:pointer; font-size:12px;">
                      <input type="checkbox" name="public_ids" value="${photo.public_id}" class="photo-checkbox"> Select
                    </label>
                  </div>
                  <div class="photo-actions">
                    <a href="${downloadUrl}" class="btn" style="padding:2px 8px;">Download</a>
                  </div>
                </div>
              </div>`;
              })
              .join('')}
          </div>`;
              })
              .join('')
      }
    </form>
  </div>

  <!-- Minimal ES5 Script: Fully Compatible with IE11 / Old Browsers -->
  <script>
    (function() {
      // Global Select All Toggle
      var selectAll = document.getElementById('selectAllCheckbox');
      if (selectAll) {
        selectAll.onclick = function() {
          var boxes = document.getElementsByName('public_ids');
          for (var i = 0; i < boxes.length; i++) {
            boxes[i].checked = selectAll.checked;
          }
        };
      }
    })();

    // Helper to toggle selection for one specific car group
    function toggleGroup(containerId) {
      var container = document.getElementById(containerId);
      if (!container) return;
      var boxes = container.getElementsByTagName('input');
      var anyUnchecked = false;
      for (var i = 0; i < boxes.length; i++) {
        if (boxes[i].type === 'checkbox' && !boxes[i].checked) {
          anyUnchecked = true;
          break;
        }
      }
      for (var j = 0; j < boxes.length; j++) {
        if (boxes[j].type === 'checkbox') {
          boxes[j].checked = anyUnchecked;
        }
      }
    }
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (m) => {
    switch (m) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return m;
    }
  });
}
