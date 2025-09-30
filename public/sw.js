// public/sw.js
self.addEventListener("push", (event) => {
  const data = event.data.json();
  console.log("New notification", data);
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/logo192.png",
    })
  );
});
