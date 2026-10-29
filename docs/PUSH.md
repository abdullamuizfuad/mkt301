# Phone notifications (optional)

Challenge invites and results always show in the site's 🔔 bell. Phone notifications send them to a student's phone or laptop as well, even when the site is closed. They are **off** until you switch them on, and nothing changes for students until then.

They use standard Web Push. On Android and on laptops, Chrome delivers them through Firebase Cloud Messaging (FCM). On iPhone they need iOS 16.4 or later, and the student must add the app to the home screen first. The free Firebase plan has no server that can send them by itself, so you send them by running a short task, by hand or as a Claude task.

## Set up (once per site)

1. Make a key pair:
   ```bash
   node tools/push/keys.mjs
   ```
2. In `cloud-config.js`, set `PUSH_ON=true` and `PUSH_KEY='<the public key>'`. Add `const PUSH_SITE='https://<your site address>/';` so a tap opens the right page. Commit and push. The public key is safe to publish.
3. In the Claude Code cloud environment's settings, add an environment secret named `MKT_PUSH_PRIVATE` with the private key. Never commit it or paste it in a chat.
4. Publish the current Firestore rules (`python3 tools/build-rules.py <class list>`). They include the `push` block.

Students then see **📱 Phone notifications → Turn on** on the 🔔 Notifications page.

## Send

```bash
npm i --no-save web-push
node tools/push/send.mjs          # or --dry to count without sending
```

It signs in as the lecturer with the same PIN secret as marking. It sends one summary message per student for notifications they haven't read and that haven't been sent before. It prints counts only. It records what it sent in `tools/push/sent.json`, which is git-ignored and never committed.

To send automatically, ask Claude to set up a scheduled task that runs this in a cloud session a few times a day. For example: "every day at 4 pm and 8 pm Maldives time, run node tools/push/send.mjs in the MKT301 repo".

## Turning it off

Set `PUSH_ON=false` in `cloud-config.js`. Students can turn it off on their device at any time from the Notifications page, which deletes their subscription.

## Privacy

A subscription is an address that only that browser's push service can use. Only the student and the lecturer can read it (`push/{SID}` in the rules), and the class backup leaves it out. Each message carries the notification text only, for example "Hawwa challenged you (24 hours)".
