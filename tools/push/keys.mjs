#!/usr/bin/env node
/* Makes a VAPID key pair for phone notifications (docs/PUSH.md). Run once: node tools/push/keys.mjs
   Put the PUBLIC key in cloud-config.js (PUSH_KEY). Put the PRIVATE key in the environment secret MKT_PUSH_PRIVATE.
   The private key is printed once and not saved anywhere. */
import crypto from 'crypto';
const {publicKey,privateKey}=crypto.generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const jp=publicKey.export({format:'jwk'}),jk=privateKey.export({format:'jwk'}),b=s=>Buffer.from(s,'base64url');
const pub=Buffer.concat([Buffer.from([4]),b(jp.x),b(jp.y)]).toString('base64url');
console.log('Public key (cloud-config.js PUSH_KEY):\n'+pub+'\n\nPrivate key (environment secret MKT_PUSH_PRIVATE, keep it secret):\n'+jk.d);
