const sharp = require(require('path').join('c:', 'axiom', 'node_modules', 'sharp'));
const fs = require('fs');
const path = require('path');

const publicDir = path.join('c:', 'axiom', 'public');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="64" fill="#08090b"/>
  <path d="M256 80L128 432h56l28-80h88l28 80h56L256 80zm0 100l52 148h-104l52-148z" fill="#f59e0b"/>
</svg>`;

async function go() {
  const buf = Buffer.from(svg);
  
  const p192 = await sharp(buf).resize(192, 192).png().toBuffer();
  const p512 = await sharp(buf).resize(512, 512).png().toBuffer();
  const p32 = await sharp(buf).resize(32, 32).png().toBuffer();
  
  fs.writeFileSync(path.join(publicDir, 'icon-192.png'), p192);
  fs.writeFileSync(path.join(publicDir, 'icon-512.png'), p512);
  console.log('icon-192.png:', p192.length, 'bytes');
  console.log('icon-512.png:', p512.length, 'bytes');
  
  // Build ICO from 32x32 PNG
  const hdr = Buffer.alloc(6);
  hdr.writeUInt16LE(0, 0);
  hdr.writeUInt16LE(1, 2);
  hdr.writeUInt16LE(1, 4);
  
  const ent = Buffer.alloc(16);
  ent.writeUInt8(32, 0);
  ent.writeUInt8(32, 1);
  ent.writeUInt8(0, 2);
  ent.writeUInt8(0, 3);
  ent.writeUInt16LE(1, 4);
  ent.writeUInt16LE(32, 6);
  ent.writeUInt32LE(p32.length, 8);
  ent.writeUInt32LE(22, 12);
  
  const ico = Buffer.concat([hdr, ent, p32]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), ico);
  console.log('favicon.ico:', ico.length, 'bytes');
  console.log('Done!');
}

go().catch(console.error);
