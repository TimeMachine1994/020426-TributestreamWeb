I am looking to rebuild my website but with a focus on the administration backend  before our front end.

We have multiple users with different permissions.
Funeral Director, Viewer, Family Member, and Contributaor, and Administrator, and Videographer.

The Videographer should be able to login to multiple devices, and setup multiple cameras as inputs. then tey can access the a controller / swticher page wehre they can add titles, images, playbck videos, and swith between cameras.

The idea is that each memorial has a unique url, and the videogrpher can setup cameras for that stream while using a different ui for actully manipulating the stream, going live, etc. 

Now, as for the admin, they should be able to edit the page for the memorial, schedule stream, and manaipulate the content using blocks, (liek adding more streams, adding embeds, etc)
The goal beign the admin can easily say we are going live tomorrow at 11am, make any changes later if needed, then the videographer can go to the controeler, pick a stream, go live, whel aso being able to add and connct devices or media from that laptop. 

Main Features:
**A** Non-Logged In Pages
Our main frontend for users to view when they are not particiapting in a stream. Mostly static pages or pages with forms.
**B** Registration and Login 
Its importnt to have different users that can regiter on different pages so its easy an clean. 
**C** Admin Panel
the admin panel should be robust and handle everything we need, from billing, to audits, to creating new users and pages.
**D** Livestream switcher
The videographer should be able to login to multiple devices, and setup multiple cameras as inputs. then tey can access the a controller / swticher page wehre they can add titles, images, playbck videos, and swith between cameras.
**E** Memorial Page
This is the main product we sell, viewers can see streams,  not leave the page to register (mmaybe a nice corner form that does it) and to interact with chat.
Work Breakdown Structure: Memorial SaaS MVP
Phase 1: Identity & Access Management (The Foundation)
Goal: Secure the backend and support multi-device videography workflows.

1.1 Role-Based Access Control (RBAC) Schema

Define permissions for: Administrator, Funeral Director, Videographer, Family Member, Contributor, and Viewer .

Implement "Permission-Aware Routing" (e.g., /switcher is only accessible to Videographers/Admins).

1.2 Advanced Session Management

Support Concurrent Device Sessions for the Videographer role (allowing a laptop for switching and 3+ phones for cameras) .

Implement JWT-based authentication with device-specific metadata.

1.3 Audit & Security

Set up SOC2-compliant logs for Admin/FD actions (e.g., who changed the stream time, who deleted a chat message) .

Enable end-to-end encryption (TLS 1.3) for all management commands .

Phase 2: Admin Memorial Management (The Block Editor)
Goal: Allow Funeral Directors to build and schedule unique memorial experiences.

2.1 Block-Based Editor Integration

Implement BlockNote as the primary React editor for Notion-style ease of use .

Develop Custom Stream Blocks: A block that fetches the current Mux live status and displays the player .

Develop Embed Blocks: Support for legacy embeds (Spotify, YouTube tributes) .

2.2 Memorial Lifecycle Management

Slug Generator: Create unique, friendly URLs (e.g., /memorials/john-doe-2026) .

Stream Scheduler: Set start/end times and automated "Coming Soon" placeholders.

2.3 Chatroom Configuration

Toggle chat on/off per memorial.

Select moderation settings (e.g., word filters) via the block sidebar .

Phase 3: Remote Camera Ingest (The "Camera Rig")
Goal: Turn any smartphone into a remote camera source for the switcher.

3.1 QR Code Pairing System

The Switcher UI generates a Session QR Code .

Develop a Camera Mode UI: A lightweight browser page that opens on the phone, requests getUserMedia() permissions, and initiates a WebRTC handshake .

3.2 WebRTC Contribution Pipeline

Implement WebRTC-to-Cloud Bridge: Ingest device streams into a cloud mixer (MCU) .

Monitoring: Return phone battery levels and connection strength to the Videographer's main dashboard .

Phase 4: The Cloud Switcher & Audio Mixer
Goal: The command center for the Videographer to produce the live broadcast.

4.1 Switcher Interface (React)

Multiviewer Grid: Real-time previews of all paired WebRTC phone cameras .

Bus Switching: Implement "Preview/Program" buttons for clean cuts between angles .

Overlays & Titles: A UI to type in "Lower Third" names and click to animate them over the live stream .

4.2 Built-in Audio Console

Develop a visual mixer using the Web Audio API with vertical faders for each camera .

Gain Control & Mute: Allow the videographer to balance audio levels or mute noisy camera feeds independently .

4.3 Cloud Compositing (The "Brain")

Configure a cloud instance (e.g., using FFmpeg or MediaMTX) to take the switched inputs and push a single RTMP feed to Mux .

Phase 5: Mux Integration & Playback (Distribution)
Goal: Global broadcast and automated archiving.

5.1 Live-to-VOD Pipeline

Configure Mux new_asset_settings to trigger automatic Live-to-VOD archiving upon stream termination .

Enable DVR Mode: Allow viewers to rewind the memorial while it is still live .

5.2 Playback Experience

Deploy an optimized Mux Player with adaptive bitrate support (ensuring high quality for good connections and zero-buffering for low bandwidth) .

Phase 6: Interaction & Moderation
Goal: Safe engagement for family and friends.

6.1 Real-time Chat Engine

Deploy a WebSocket-based chat restricted to the memorial session .

6.2 Moderation Dashboard

Build a Moderator UI for Admins/Funeral Directors to delete messages or ban disruptive users in real-time .

Add a "Contributor" block that allows family members to upload photos during the service.

Phase 7: Production Readiness
Goal: Ensure the system is fail-safe for non-repeatable events.

7.1 Optimistic UI Updates

Ensure the Switcher UI feels "zero-latency" by using optimistic state updates for camera cuts.

7.2 Disaster Recovery (DR)

Implement automated database backups with a 15-minute Recovery Point Objective (RPO).

7.3 Final Testing

Stress test the Cloud Mixer with multiple 4K WebRTC inputs .

Implementation Order Summary
RBAC & Authentication (Phase 1)

WebRTC Phone-to-Browser Ingest (Phase 3)

Basic Switcher UI & Cloud Mixing (Phase 4)

Mux Integration & Playback (Phase 5)

Admin Block Editor (Phase 2)

Chat & Moderation (Phase 6)