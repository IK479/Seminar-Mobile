
Analytics-SDK
The Application
The application I built is a classic, full-fledged Full-Stack project that combines both worlds: the client-side (Frontend) and the server-side (Backend), along with a database. It is a task management application integrated with a portal that serves as an analytics dashboard for user activities.

The SDK is the core software component I developed. It is a standalone file that can be embedded into any website with just a few lines of code. It functions as a smart intermediary layer that manages background data collection without overloading the website's performance.

The Three Core Mechanisms of the SDK
1. Batching
Without Batching: Every click, scroll, and movement on the site triggers an immediate network request to the server. If there are 1,000 active users creating tasks and clicking around, the server will receive thousands of requests per second, causing it to crash (or cost you a fortune).

With Batching: The SDK ensures events are not sent individually. It opens a "mailbox" (an in-memory array), collects the events inside, and only when the mailbox is full (e.g., reaches 10 events) or after 5 seconds have passed, it packs everything into a single payload and sends it to the server in one go.

2. Offline Support
In the real world, users' internet connections aren't always stable—trains go through tunnels, campus Wi-Fi drops momentarily, or cellular reception weakens.

Without Offline Support: If a user creates a task while disconnected, the analytics fetch request will fail, and the event (crucial research data) will be deleted and lost forever.

With Offline Support: The SDK constantly listens to the browser's network status. The moment it detects a disconnection, it halts network requests to prevent failures while ensuring no data is lost. This is where the third component comes into play—the Cache.

3. Cache
A cache is a fast, temporary storage space. In the context of this SDK, it utilizes the browser's localStorage (a micro-database built into the user's browser).

Going Offline: The moment the SDK detects that the user is offline, it takes the event bundle (the batch) and, instead of sending it over the network, writes it into localStorage. The data is securely locked there, even if the user closes the browser tab!

The Flush Mechanism: As soon as the internet connection is restored (Online), the SDK automatically wakes up, accesses the local cache, retrieves all the events accumulated during the downtime, and sends them orderly to MongoDB. The cache is then cleared, providing a seamless experience where the user never even noticed a disconnection.

The Server-Side & Management Portal
The Backend engine receives the data bundles from the SDK, validates them using a unique X-API-KEY, and records them in the database.

Instead of storing static state tables, the server implements Event Sourcing logic. It runs complex aggregation pipelines on the raw event log to calculate real-time metrics for the management portal:

Funnel Analysis: The percentage of users who created a task versus those who actually completed it.

Mean Time to Complete: A mathematical calculation of the timestamp differences between a task's creation and its completion.

Activity Heatmap: The distribution of user activity and server load across different hours of the day.

Live Streaming: Utilizing WebSockets (Socket.io) to "push" events from the SDK directly to the admin dashboard the fraction of a second they occur, without requiring a page refresh.



https://github.com/user-attachments/assets/89e8f3fe-f600-4278-8e47-8ae482739190



