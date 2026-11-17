// Hands bytes to the browser as a download into the person's own downloads folder. Nothing is sent
// anywhere: the address is a local object URL that only this page can resolve.

const revokeAfterMs = 30000;

export function saveBytes(filename, bytes, type = 'application/octet-stream') {
  const url = URL.createObjectURL(new Blob([bytes], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  // The download starts after the click returns; revoking at once cancels it in some engines.
  setTimeout(() => URL.revokeObjectURL(url), revokeAfterMs);
}
