# Video Switcher & Compositor - Work Breakdown Structure

**Created:** February 6, 2026  
**Status:** 🔵 Planning  
**Depends On:** Phases 1-9 (Videographer Journey) ✅ Complete

---

## Overview

Rebuild the video switcher page with a real-time Canvas 2D compositor engine, Svelte 5 best practices, transitions, overlays, and Mux WHIP output. This WBS covers both fixing existing Svelte issues and building the compositor pipeline.

---

## Svelte 5 Best Practices Audit (Pre-Compositor)

The svelte-autofixer identified these issues in the current codebase:

### Issues Found

| # | File | Issue | Fix |
|---|------|-------|-----|
| 1 | `+page.svelte:61` | `data.memorial.status` captured once, not reactive | Use `$derived` instead of `$state` for `currentStatus` |
| 2 | `+page.svelte:13` | `deviceStates` uses `Map` with self-assignment hack | Use `SvelteMap` from `svelte/reactivity` |
| 3 | `+page.svelte:47-57` | `srcObject` uses legacy action pattern | Convert to Svelte 5 attachment |
| 4 | `+page.svelte:230,254,312` | `{#each}` blocks missing keys | Add `(device.id)` / `(local.id)` keys |
| 5 | `DeviceStream.svelte:14` | `bind:this` on video element | Consider action/attachment pattern |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                    SWITCHER PAGE (Svelte 5)                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │  Source     │  │ Compositor │  │  Transition  │  │  Overlay   │  │
│  │  Manager   │─▶│  Engine    │◀─│  Engine      │  │  Manager   │  │
│  │(.svelte.ts)│  │(.svelte.ts)│  │  (.ts)       │  │  (.ts)     │  │
│  └────────────┘  └─────┬──────┘  └──────────────┘  └────────────┘  │
│                        │                                             │
│              ┌─────────┼─────────┐                                   │
│              ▼         ▼         ▼                                   │
│  ┌────────────┐  ┌──────────┐  ┌────────────┐                      │
│  │  Preview   │  │ Program  │  │  Source     │                      │
│  │  Monitor   │  │ Monitor  │  │  Grid       │                      │
│  │ (Canvas)   │  │ (Canvas) │  │ (Thumbnails)│                      │
│  └────────────┘  └────┬─────┘  └────────────┘                      │
│                       │                                              │
│              ┌────────┼────────┐                                     │
│              ▼        ▼        ▼                                     │
│  ┌────────────┐  ┌──────────┐  ┌────────────┐                      │
│  │ Audio      │  │  WHIP    │  │  Stream    │                      │
│  │ Mixer      │  │  Client  │  │  Controls  │                      │
│  │ (stub)     │  │  (.ts)   │  │  (UI)      │                      │
│  └────────────┘  └──────────┘  └────────────┘                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Work Breakdown Structure

### ✅ 10.0 Svelte 5 Best Practices Fixes
**Status:** Pending  
**Priority:** High — must fix before building compositor

| Task | File | Description |
|------|------|-------------|
| 10.1 | `+page.svelte` | Replace `$state(data.memorial.status)` with `$derived(data.memorial.status)` for `currentStatus` |
| 10.2 | `+page.svelte` | Replace `Map` with `SvelteMap` from `svelte/reactivity` for `deviceStates` |
| 10.3 | `+page.svelte` | Convert `srcObject` action to Svelte 5 attachment |
| 10.4 | `+page.svelte` | Add keys to all `{#each}` blocks: `(device.id)`, `(local.id)` |
| 10.5 | `DeviceStream.svelte` | Replace `bind:this` with action/attachment for video element |

---

### 11.0 Compositor Types & Shared Interfaces
**Status:** Pending

| Task | File | Description |
|------|------|-------------|
| 11.1 | `src/lib/compositor/types.ts` | Define `VideoSource`, `TransitionType`, `OverlayConfig`, `CompositorConfig` types |

**Key Types:**
```typescript
interface VideoSource {
  id: string;
  type: 'webrtc' | 'local';
  videoElement: HTMLVideoElement;
  label: string;
  connected: boolean;
}

type TransitionType = 'cut' | 'fade' | 'wipe';

interface CompositorConfig {
  width: 1280;
  height: 720;
  fps: 30;
}
```

---

### 12.0 Source Manager
**Status:** Pending

| Task | File | Description |
|------|------|-------------|
| 12.1 | `src/lib/compositor/SourceManager.svelte.ts` | Reactive source registry using `SvelteMap` |
| 12.2 | `src/lib/compositor/SourceManager.svelte.ts` | `addSource()`, `removeSource()`, `getSource()` methods |
| 12.3 | `src/lib/compositor/SourceManager.svelte.ts` | `sources` as reactive `$state` for UI binding |
| 12.4 | `src/lib/compositor/SourceManager.svelte.ts` | Handle both WebRTC `MediaStream` and local `MediaStream` uniformly |

**API:**
```typescript
class SourceManager {
  sources: SvelteMap<string, VideoSource>;
  activePreview: string | null;   // $state
  activeProgram: string | null;   // $state
  
  addSource(id: string, stream: MediaStream, label: string, type: 'webrtc' | 'local'): void;
  removeSource(id: string): void;
  setPreview(id: string): void;
  setProgram(id: string): void;
}
```

---

### 13.0 Compositor Engine
**Status:** Pending

| Task | File | Description |
|------|------|-------------|
| 13.1 | `src/lib/compositor/Compositor.svelte.ts` | Canvas render loop with `requestVideoFrameCallback` (+ `rAF` fallback) |
| 13.2 | `src/lib/compositor/Compositor.svelte.ts` | `drawImage()` rendering of program source at 1280×720 |
| 13.3 | `src/lib/compositor/Compositor.svelte.ts` | Separate preview canvas rendering |
| 13.4 | `src/lib/compositor/Compositor.svelte.ts` | `captureStream(30)` output for program feed |
| 13.5 | `src/lib/compositor/Compositor.svelte.ts` | Start/stop lifecycle with `$effect` cleanup |

**API:**
```typescript
class Compositor {
  programCanvas: HTMLCanvasElement;   // set externally
  previewCanvas: HTMLCanvasElement;   // set externally
  outputStream: MediaStream | null;   // $state
  isRunning: boolean;                 // $state
  fps: number;                        // $derived (actual measured fps)
  
  constructor(sourceManager: SourceManager, config: CompositorConfig);
  start(): void;
  stop(): void;
  takeToProgram(transition: TransitionType, durationMs?: number): void;
}
```

---

### 14.0 Transition Engine
**Status:** Pending

| Task | File | Description |
|------|------|-------------|
| 14.1 | `src/lib/compositor/TransitionEngine.ts` | State machine: `idle` → `transitioning` → `idle` |
| 14.2 | `src/lib/compositor/TransitionEngine.ts` | `cut` transition (instant swap) |
| 14.3 | `src/lib/compositor/TransitionEngine.ts` | `fade` transition (animate `globalAlpha` 0→1 over duration) |
| 14.4 | `src/lib/compositor/TransitionEngine.ts` | Easing functions: linear, ease-in-out |
| 14.5 | `src/lib/compositor/TransitionEngine.ts` | `getBlendState()` method returning current opacity values for both sources |

**API:**
```typescript
class TransitionEngine {
  state: 'idle' | 'transitioning';
  progress: number;  // 0.0 → 1.0
  
  startTransition(type: TransitionType, durationMs: number): void;
  tick(timestamp: number): BlendState;
  cancel(): void;
}

interface BlendState {
  sourceA: { id: string; opacity: number };
  sourceB: { id: string; opacity: number };
  complete: boolean;
}
```

---

### 15.0 Overlay Manager
**Status:** Pending

| Task | File | Description |
|------|------|-------------|
| 15.1 | `src/lib/compositor/OverlayManager.ts` | Overlay layer system (z-ordered) |
| 15.2 | `src/lib/compositor/OverlayManager.ts` | PNG image overlay with position/scale |
| 15.3 | `src/lib/compositor/OverlayManager.ts` | `fillText` lower third with background |
| 15.4 | `src/lib/compositor/OverlayManager.ts` | Show/hide with opacity animation |
| 15.5 | `src/lib/compositor/OverlayManager.ts` | `render(ctx)` method called by compositor after video layer |

---

### 16.0 Audio Mixer (Infrastructure Stub)
**Status:** Pending

| Task | File | Description |
|------|------|-------------|
| 16.1 | `src/lib/compositor/AudioMixer.ts` | `AudioContext` + `MediaStreamAudioDestinationNode` |
| 16.2 | `src/lib/compositor/AudioMixer.ts` | `connectSource()` / `disconnectSource()` |
| 16.3 | `src/lib/compositor/AudioMixer.ts` | Per-source `GainNode` (volume control stub) |
| 16.4 | `src/lib/compositor/AudioMixer.ts` | `getOutputStream()` → audio `MediaStream` |
| 16.5 | `src/lib/compositor/AudioMixer.ts` | Merge audio + video tracks into combined `MediaStream` |

---

### 17.0 Mux WHIP Client
**Status:** Pending

| Task | File | Description |
|------|------|-------------|
| 17.1 | `src/lib/compositor/WhipClient.ts` | WHIP client: `RTCPeerConnection` → Mux WebRTC ingest |
| 17.2 | `src/lib/compositor/WhipClient.ts` | SDP offer/answer exchange via WHIP HTTP POST |
| 17.3 | `src/routes/api/streams/whip/+server.ts` | Server-side WHIP proxy endpoint (if needed) |
| 17.4 | `src/lib/compositor/WhipClient.ts` | Connection state tracking (`$state`) |
| 17.5 | `src/lib/compositor/WhipClient.ts` | Reconnection logic on disconnect |
| 17.6 | `src/lib/compositor/WhipClient.ts` | `connect(stream: MediaStream)` / `disconnect()` |

---

### 18.0 Compositor Canvas Component
**Status:** Pending

| Task | File | Description |
|------|------|-------------|
| 18.1 | `src/lib/components/CompositorCanvas.svelte` | `<canvas>` element bound to compositor engine |
| 18.2 | `src/lib/components/CompositorCanvas.svelte` | Aspect-ratio container (16:9) |
| 18.3 | `src/lib/components/CompositorCanvas.svelte` | FPS counter overlay (dev mode) |
| 18.4 | `src/lib/components/CompositorCanvas.svelte` | Connection to compositor via `$effect` lifecycle |

---

### 19.0 Switcher Page Rebuild
**Status:** Pending

| Task | File | Description |
|------|------|-------------|
| 19.1 | `+page.svelte` | Replace placeholder Preview monitor with `CompositorCanvas` (preview mode) |
| 19.2 | `+page.svelte` | Replace placeholder Program monitor with `CompositorCanvas` (program mode) |
| 19.3 | `+page.svelte` | Wire source grid thumbnails to `SourceManager` |
| 19.4 | `+page.svelte` | Update TAKE button to call `compositor.takeToProgram()` with transition type |
| 19.5 | `+page.svelte` | Add transition type selector (Cut / Fade dropdown) |
| 19.6 | `+page.svelte` | Update GO LIVE to initiate WHIP connection with compositor output stream |
| 19.7 | `+page.svelte` | Add stream health indicator (fps, bitrate, connection state) |
| 19.8 | `+page.svelte` | Add overlay controls in sidebar (logo toggle, lower third input) |

---

## File Structure (New Files)

```
src/lib/
├── compositor/
│   ├── types.ts                     # Shared types
│   ├── SourceManager.svelte.ts      # Reactive source registry
│   ├── Compositor.svelte.ts         # Canvas render loop + output
│   ├── TransitionEngine.ts          # Transition state machine
│   ├── OverlayManager.ts            # PNG + text overlays
│   ├── AudioMixer.ts                # Web Audio infrastructure
│   └── WhipClient.ts                # Mux WHIP WebRTC output
├── components/
│   └── CompositorCanvas.svelte      # Canvas display component
```

---

## Implementation Order

```
Phase 10  ──▶  Phase 11  ──▶  Phase 12  ──▶  Phase 13  ──▶  Phase 14
(Svelte fixes)  (Types)      (Sources)      (Compositor)   (Transitions)
                                                │
                                                ├──▶  Phase 15 (Overlays)
                                                ├──▶  Phase 16 (Audio stub)
                                                ├──▶  Phase 17 (WHIP)
                                                └──▶  Phase 18 + 19 (UI integration)
```

Phases 15, 16, 17 can be developed in parallel after Phase 13 is complete.

---

## Svelte 5 Patterns Used

| Pattern | Where | Why |
|---------|-------|-----|
| `$state` | SourceManager, Compositor | Reactive class fields |
| `$derived` | Compositor fps, currentStatus | Computed values |
| `$effect` | Compositor lifecycle, canvas binding | Side effects with cleanup |
| `SvelteMap` | SourceManager, device states | Reactive Map without self-assignment |
| Attachments | srcObject, canvas binding | Svelte 5 replacement for actions on elements |
| `{#each (key)}` | Source grid, device list | Keyed lists for correct diffing |
| `.svelte.ts` | SourceManager, Compositor | Reactive classes in module files |

---

## Testing Checklist

- [ ] All `{#each}` blocks have keys
- [ ] No `$state` capturing initial value of reactive data
- [ ] `SvelteMap` replaces `Map` + self-assignment
- [ ] Compositor renders single source at 720p/30fps
- [ ] Cut transition works (instant swap)
- [ ] Fade transition animates smoothly over 500ms
- [ ] `captureStream()` outputs valid MediaStream
- [ ] Source thumbnails update reactively
- [ ] Preview shows selected source video
- [ ] Program shows active source video
- [ ] TAKE button triggers transition
- [ ] GO LIVE initiates WHIP connection
- [ ] END STREAM disconnects WHIP
- [ ] Overlay renders on program output
- [ ] Audio stub creates combined MediaStream

---

## Estimated Effort

| Phase | Description | Effort |
|-------|-------------|--------|
| 10 | Svelte 5 fixes | 0.5 days |
| 11 | Types | 0.5 days |
| 12 | Source Manager | 1 day |
| 13 | Compositor Engine | 1-2 days |
| 14 | Transition Engine | 1 day |
| 15 | Overlay Manager | 1 day |
| 16 | Audio Mixer stub | 0.5 days |
| 17 | WHIP Client | 2-3 days |
| 18-19 | UI Integration | 1-2 days |
| **Total** | | **8-12 days** |
