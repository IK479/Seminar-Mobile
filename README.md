# Real-Time Analytics SDK
The project is an Analytics SDK – a lightweight, easy-to-integrate client-side SDK designed for application and web developers. The SDK solves a real pain point for developers: instead of building a complex, expensive data collection infrastructure from scratch, this library allows them to track, aggregate, and send usage data, user behavior, and crashes directly to a secured server. The system includes a highly efficient API server and a database optimized for high write-volumes, alongside an advanced Developer Portal that displays all metrics and aggregations in real time.


# Features List
* Real-Time Bulk Ingestion (Batching): Bundles and transmits event packages in batches to prevent network overload (self-DDoS) on the server side and conserve client device resources.

* Robust Offline Support: A local caching mechanism that automatically stores events when there is no internet connectivity and flushes them directly to the server as soon as the network returns.

* Automated Metadata Ingestion: Automatically captures client-side metadata such as screen resolution, browser language, and device User Agent without any developer intervention.

* Reactive Live Dashboard: Utilizes WebSockets technology to instantly update the portal's management dashboard and live event stream without requiring page refreshes.

* Clean Crash Logging: Catches application exceptions and crashes, storing them in a clean, focused JSON structure for fast debugging and analysis.


# Technology Stack
SDK: Vanilla JavaScript (ES6+).
Offline Cache: HTML5 localStorage.
Network: Native Fetch API & Network Listeners.
Backend: Node.js + Express.js.
Real-Time Data: Socket.io (WebSockets).
Database: MongoDB Atlas.
Database ODM: Mongoose.
Portal UI: Vanilla HTML5, CSS3, & JS.
Charts: Chart.js.  




