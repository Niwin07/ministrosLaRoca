self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title ?? "Ministros";
  const options = {
    body: data.body ?? "",
    icon: "/icon-192.png",
    badge: "/icon-72.png",
    data: { url: "/" },
    vibrate: [200, 100, 200],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if ("focus" in client) return client.focus();
        }
        return clients.openWindow(event.notification.data?.url ?? "/");
      }),
  );
});
