
Analytics-SDK
The application I built is a classic, full-featured Full-Stack project that integrates both worlds: the Client-Side (Frontend) and the Server-Side (Backend), along with a database. It is a task management application featuring a management portal that serves as an analytics dashboard for user activities.

The SDK is the core software component I developed. It is a standalone script/file that can be embedded into any website using just a few lines of code. It acts as an intelligent middleware layer that manages background data collection without adding overhead to the host website's performance.

The SDK's Three Core Mechanisms:
1. Batching
Without Batching: Every click, scroll, and user action on the site triggers an immediate network request to the server. If there are 1,000 active users creating tasks and clicking around, the server will receive thousands of requests per second, causing it to crash (or incur massive hosting costs).

With Batching: The SDK avoids sending each event individually. It opens a temporary "mailbox" (an in-memory array) to collect events. Only when the mailbox is full (e.g., reaches 10 events) or when a 5-second timer expires, does it bundle everything into a single large payload and send it to the server in one go.

2. Offline Support
In the real world, user internet connections are not always stable—trains enter tunnels, campus Wi-Fi drops momentarily, or cellular reception fluctuates.

Without Offline Support: If a user performs an action while disconnected, the analytics fetch request will fail, and the event data (which is critical for your product research) will be permanently lost.

With Offline Support: The SDK constantly listens to the browser's network status. The moment it detects an offline state, it halts network requests to prevent failures while ensuring no data is lost. This is where the third component—the Cache—comes into play.

3. Cache
The cache serves as a fast, temporary storage space. In the context of this SDK, it utilizes the browser's localStorage (acting as a micro-database built right into the user's browser).

The moment the SDK detects that the user is offline, it takes the current event bundle (the batch) and writes it into localStorage instead of attempting a network request. The data is safely locked away there, even if the user closes the browser tab.

The Flush Mechanism: As soon as the internet connection is restored (Online), the SDK automatically wakes up, accesses the local cache, extracts all events accumulated during the downtime, and streams them smoothly to MongoDB. The cache is then cleared, and the user experiences a completely seamless transition without ever noticing the interruption.

Backend & Management Portal
The backend engine receives data packages from the SDK, validates them using a unique X-API-KEY, and logs them into the database.

Instead of maintaining static state tables, the server implements Event Sourcing logic. It executes complex Aggregation Pipelines on the raw event logs to calculate real-time insights for the management portal:

Funnel Analysis: The percentage of users who initiated a task versus those who actually completed it.

Mean Time to Complete (MTTC): A mathematical calculation of the timestamp differences between a task's creation and its completion.

Activity Heatmap: The distribution of user activity and system load across different hours of the day.

Live Streaming: Utilizing WebSockets (Socket.io) to "push" events from the SDK directly to the admin dashboard the exact millisecond they occur, completely eliminating the need for page refreshes.
