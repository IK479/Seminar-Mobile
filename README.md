# Real-Time Analytics SDK
The project is an Analytics SDK – a lightweight, easy-to-integrate client-side SDK designed for application and web developers. The SDK solves a real pain point for developers: instead of building a complex, expensive data collection infrastructure from scratch, this library allows them to track, aggregate, and send usage data, user behavior, and crashes directly to a secured server. The system includes a highly efficient API server and a database optimized for high write-volumes, alongside an advanced Developer Portal that displays all metrics and aggregations in real time.


# Features List
* Real-Time Bulk Ingestion (Batching): Bundles and transmits event packages in batches to prevent network overload (self-DDoS) on the server side and conserve client device resources.

* Robust Offline Support: A local caching mechanism that automatically stores events when there is no internet connectivity and flushes them directly to the server as soon as the network returns.

* Automated Metadata Ingestion: Automatically captures client-side metadata such as screen resolution, browser language, and device User Agent without any developer intervention.

* Reactive Live Dashboard: Utilizes WebSockets technology to instantly update the portal's management dashboard and live event stream without requiring page refreshes.

* Clean Crash Logging: Catches application exceptions and crashes, storing them in a clean, focused JSON structure for fast debugging and analysis.


# Technology Stack

| Component | Technology Used | Description / Purpose |
| :--- | :--- | :--- |
| **SDK Core** | Vanilla JavaScript (ES6+) | Zero-dependency, lightweight implementation |
| **Offline Cache** | HTML5 `localStorage` | Client-side queueing for robust offline persistence |
| **Network** | Fetch API & Web Listeners | Asynchronous batch transmissions & network status checks |
| **Backend** | Node.js + Express.js | Asynchronous REST API routing & validation middleware |
| **Real-Time Data** | Socket.io (WebSockets) | Instant data push from server to developer portal |
| **Database** | MongoDB Atlas | High-throughput cloud document store for raw metrics |
| **Database ODM** | Mongoose | Schema definitions, indexing, and complex aggregations |
| **Portal UI** | Vanilla HTML5 + CSS3 + JS | Lightweight, high-performance monitoring dashboard |
| **Charts** | Chart.js | Hardware-accelerated interactive metrics rendering |



## Data Structures

| Structure Name | Component | Type | Description / Key Fields |
| :--- | :--- | :--- | :--- |
| **Standard Event Object** | Client SDK | JavaScript Object | Formatted payload containing: `projectId`, `eventName`, `userId`, `timestamp`, dynamic custom `properties`, and automated client `metadata`. |
| **Local Cache Queue** | Client SDK | JSON Array | A serialized list of standard event objects saved in `localStorage` when client status is offline. |
| **Database Schema** | Backend Server | Mongoose / MongoDB Document | Persisted server document defining structural constraints for event logging, with an optimized index on `{ projectId: 1, timestamp: -1 }` |
| **Clean Crash Payload** | Client / Server | JSON Object | A dedicated diagnostic payload embedded within `properties` containing: `error_message`, crashing `component`, and the exact code `line` number. |


## How to Use - Quick Start

Follow these steps to integrate the Analytics SDK into your web application.

### 1. Client-Side Integration (SDK Implementation)

Include the `analytics-sdk.js` file into your project structure and load it at the top of your main HTML file[cite: 3]:

```html
<!-- Load the Analytics SDK library -->
<script src="analytics-sdk.js"></script>

// Initialize the SDK with your Project ID and API Key
const projectId = "productivity_app_2026";
analytics.init("my_secret_api_key_123", projectId);

// Identify an authenticated user session
analytics.setUserId("user_ido_katz");

// Track custom analytical events with dynamic parameters
analytics.trackEvent("task_created", {
    task_name: "Complete Project README",
    difficulty: "Medium"
});

// Clear user session upon logging out
analytics.clearUserId();

// Initialize the SDK with your Project ID and API Key
const projectId = "productivity_app_2026";
analytics.init("my_secret_api_key_123", projectId);

// Identify an authenticated user session
analytics.setUserId("user_ido_katz");

// Track custom analytical events with dynamic parameters
analytics.trackEvent("task_created", {
    task_name: "Complete Project README",
    difficulty: "Medium"
});

// Clear user session upon logging out


## System Architecture & Diagrams

### 1. System Architecture Diagram
The following blueprint demonstrates the real-time data flow between the Client App (embedded with our SDK), the Express Backend, the Cloud Database, and the Reactive Developer Dashboard[cite: 1, 6, 7]:

┌─────────────────────────────────┐        HTTP POST (Batch / JSON)       ┌─────────────────────────────────┐│     Client Developer App        ├──────────────────────────────────────►│        Express API Server       ││  (Isolated SDK Context + Cache) │◄──────────────────────────────────────┤     (Authentication Middleware)  │└─────────────────────────────────┘               WebSockets              └───────────────┬─────────────────┘(Socket.io)                              │┌─────────────────────────────────┐                   ▲                                   │ Mongoose ORM│        Developer Portal         │───────────────────┘                                   ▼│     (Reactive Live Dashboard)   │                                       ┌─────────────────────────────────┐└─────────────────────────────────┘                                       │         Database Storage        ││      (MongoDB Atlas Cluster)    │└─────────────────────────────────┘
### 2. Event Lifecycle (State Diagram)
The Client SDK operates deterministically as a state machine based on the host platform's runtime network status[cite: 1]:

             ┌────────────────────────────────┐
             │          ONLINE STATE          │
             │  - Direct HTTP Delivery        │
             │  - Immediate Server Flush      │
             └──────────────┬─────────────────┘
                            │
             Network Drops  │  Network Restored
              (via Web API) │   (via Web API)
                            ▼
             ┌────────────────────────────────┐
             │         OFFLINE STATE          │
             │  - Non-blocking Queueing       │
             │  - localStorage Serialization  │
             └────────────────────────────────┘

### 3. Sequence Diagram (Online vs. Offline Pipeline)
This lifecycle trace details how a tracked event is captured, managed under varying connectivity constraints, and propagated to the developer interface[cite: 1, 6, 7]:

Developer App             Client SDK               LocalStorage              Server API            Developer Portal│                       │                         │                        │                        ││── trackEvent("init")─►│                         │                        │                        ││                       │── check Network Status ─►│                        │                        ││                       │                         │                        │                        ││                       │── [If Device Is Online] ────────────────────────►│                        ││                       │                                                  │── io.emit("new-event")►││                       │◄───────────────── 201 Created ───────────────────│                        ││                       │                         │                        │                        ││                       │── [If Device Is Offline]────────────────         │                        ││                       │                         │               │        │                        ││                       │                         │◄──saveToCache─┘        │                        ││                       │                         │                        │                        ││                       │── window:online Detected│                        │                        ││                       │── flushCache() ────────►│                        │                        ││                       │◄─ Read Array & Clear ───│                        │                        ││                       │                         │                        │                        ││                       │── POST /api/v1/events (Bulk JSON Payload) ──────►│                        ││                       │                                                  │── io.emit("bulk-sync")►│
---

## Database Efficiency & Algorithmic Analysis ($O$ Notation)

To handle intense analytical ingestion workloads and keep server lookups highly performant, our database layer features a specialized **Compound Index** targeting lookups by project identity and reverse chronological order:

```javascript
// Index strategy optimized for Dashboard Aggregations & Reverse Log Tables
eventSchema.index({ projectId: 1, timestamp: -1 });
Algorithmic Efficiency Matrix ($O$-Notation):Component / EndpointDatabase Database LogicTime Complexity Without IndexTime Complexity With Index (Our Strategy)Architectural MotivationBulk Event IngestionPOST /api/v1/events  insertMany(events)  $O(N)$$O(N)$Straightforward sequential write execution into the document collection storage cluster.  Real-Time Log StreamGET /.../:projectId/events  find({ projectId }).sort({ timestamp: -1 })  $O(M \cdot \log M)$$O(\log M) + O(K)$Avoids expensive in-memory collections sorting by matching the b-tree index layout directly.  Analytical AggregationsGET /.../:projectId/stats  aggregate([ { $match }, { $group } ])  $O(M)$$O(\log M) + O(K)$Narrows down search space via fast index bounds prior to calculating analytics groups.  $N$: Number of raw events within the currently transmitted bulk request packet[cite: 7].$M$: Absolute total document mass across the database namespace database entity.$K$: Specific document slice belonging to the indexed matching query parameters.
analytics.clearUserId();






