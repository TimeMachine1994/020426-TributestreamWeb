# Work Breakdown Structure: Device Management & Cleanup

**Date:** 2026-02-09  
**Status:** In Progress  
**Priority:** High

---

## Problem Summary

The device pairing system accumulates stale devices in the database from failed or abandoned connection attempts. Currently showing 23 devices when only 5 are active. This causes:
- Confusing UI showing wrong device counts
- Database bloat
- Potential performance issues with signaling message queries

---

## Phase 1: Automatic Device Cleanup ✅ Partially Complete

### 1.1 Cleanup API Endpoint
- **File:** `src/routes/api/devices/cleanup/+server.ts`
- **Status:** ✅ Created
- **Function:** Deletes stale devices (pending with expired tokens, connecting not seen in 1hr, disconnected)

### 1.2 Automatic Cleanup on Switcher Load
- **File:** `src/routes/(protected)/switcher/[memorialId]/+page.server.ts`
- **Status:** ✅ Complete
- **Tasks:**
  - [x] Add cleanup logic before fetching devices
  - [x] Delete pending devices with expired tokens
  - [x] Delete connecting devices not seen in 1+ hour with expired tokens
  - [x] Delete related signaling messages first (foreign key constraint)

### 1.3 Device Filtering (Already Applied)
- **File:** `src/routes/(protected)/switcher/[memorialId]/+page.server.ts`
- **Status:** ✅ Complete
- **Logic:**
  - Show `connected` devices seen in last 30 minutes
  - Show `connecting` devices with valid token OR seen in last 5 minutes

---

## Phase 2: Device Status Polling ✅ Complete

### 2.1 Device Status API
- **File:** `src/routes/api/devices/[deviceId]/status/+server.ts`
- **Status:** ✅ Created
- **Function:** Returns device status for polling

### 2.2 AddCameraModal Polling
- **File:** `src/lib/components/AddCameraModal.svelte`
- **Status:** ✅ Complete
- **Logic:** Polls every 2s to check if device status changed to `connecting`

### 2.3 Switcher Auto-Refresh
- **File:** `src/routes/(protected)/switcher/[memorialId]/+page.svelte`
- **Status:** ✅ Complete
- **Logic:** `invalidateAll()` called when device becomes ready

---

## Phase 3: Token & Validation Fixes ✅ Complete

### 3.1 Token Re-validation
- **File:** `src/routes/api/devices/validate/+server.ts`
- **Status:** ✅ Complete
- **Fix:** Allow re-validation when status is `pending` OR `connecting`

### 3.2 Create-Token Returns Device ID
- **File:** `src/routes/api/devices/create-token/+server.ts`
- **Status:** ✅ Complete
- **Fix:** Return `deviceId` in response for polling

---

## Phase 4: HTTPS & Camera Access ✅ Complete

### 4.1 Vite HTTPS Plugin
- **File:** `vite.config.ts`
- **Status:** ✅ Complete
- **Fix:** Added `@vitejs/plugin-basic-ssl` for self-signed cert

### 4.2 QR Code HTTPS URLs
- **File:** `src/lib/components/AddCameraModal.svelte`
- **Status:** ✅ Complete
- **Fix:** Force `https://` in QR code URLs

---

## Phase 5: Phone Video Preview Fix ✅ Complete

### 5.1 Reactive Stream Attachment
- **File:** `src/routes/camera/+page.svelte`
- **Status:** ✅ Complete
- **Fix:** Use `$effect` to attach stream when video element available

---

## Remaining Work

### Immediate (Do Now)
1. **Add automatic cleanup to switcher page load**
   - Delete pending devices with expired tokens
   - Delete stale connecting devices
   - Clean up orphaned signaling messages

### Future Enhancements
1. **Device heartbeat** — Phone sends periodic status updates
2. **Graceful disconnect** — Mark device disconnected on page unload
3. **Admin cleanup UI** — Button to manually clean up devices
4. **Device naming** — Allow user to name cameras (Camera 1, Camera 2, etc.)
5. **Connection quality indicator** — Show network stats on phone

---

## File Summary

| File | Changes |
|------|---------|
| `vite.config.ts` | HTTPS plugin |
| `src/routes/api/devices/create-token/+server.ts` | Return deviceId, logging |
| `src/routes/api/devices/validate/+server.ts` | Re-validation fix, logging |
| `src/routes/api/devices/[deviceId]/status/+server.ts` | New status endpoint |
| `src/routes/api/devices/cleanup/+server.ts` | New cleanup endpoint |
| `src/routes/api/signaling/send/+server.ts` | Logging |
| `src/routes/api/signaling/poll/+server.ts` | Logging |
| `src/routes/camera/+page.svelte` | $effect for video, error handling |
| `src/lib/components/AddCameraModal.svelte` | HTTPS, device polling, onDeviceReady |
| `src/lib/components/DeviceStream.svelte` | Logging |
| `src/lib/webrtc/peer.ts` | Logging |
| `src/lib/webrtc/signaling.ts` | Logging |
| `src/routes/(protected)/switcher/[memorialId]/+page.svelte` | handleDeviceReady |
| `src/routes/(protected)/switcher/[memorialId]/+page.server.ts` | Device filtering, needs cleanup |

---

## Testing Checklist

- [ ] Generate QR code on switcher
- [ ] Scan with phone, accept HTTPS warning
- [ ] Grant camera permission
- [ ] Phone shows local camera preview
- [ ] Switcher auto-refreshes and shows new device
- [ ] WebRTC connection established (status: connected)
- [ ] Video stream visible on switcher
- [ ] Old devices cleaned up on page refresh
- [ ] Token retry works after permission denied
