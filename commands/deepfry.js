const Canvas = require('canvas');

module.exports = {
  name: 'deepfry',
  async execute(message) {
    let imageAttachment = null;

    if (message.attachments.size > 0) {
      imageAttachment = message.attachments.first();
    }

    if (!imageAttachment && message.reference) {
      const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
      if (repliedMessage.attachments.size > 0) {
        imageAttachment = repliedMessage.attachments.first();
      }
    }

    if (!imageAttachment) {
      const messages = await message.channel.messages.fetch({ limit: 10 });
      for (const [_, msg] of messages) {
        if (msg.attachments.size > 0) {
          imageAttachment = msg.attachments.first();
          break;
        }
      }
    }

    if (!imageAttachment) {
      return message.reply('No image found.');
    }

    const image = await Canvas.loadImage(imageAttachment.url);
    const width = image.width;
    const height = image.height;

    const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Draw the image
    ctx.drawImage(image, 0, 0, width, height);

    // Get pixel data
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Deepfry: Boost contrast, saturation, brightness
    for (let i = 0; i < data.length; i += 4) {
      // Get original RGB
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Boost brightness
      r = r * 1.3;
      g = g * 1.3;
      b = b * 1.3;

      // Increase contrast
      r = ((r - 128) * 2) + 128;
      g = ((g - 128) * 2) + 128;
      b = ((b - 128) * 2) + 128;

      // Add yellow-red tint
      r = r + 30;
      g = g + 20;
      b = b - 20;

      // Clamp values
      data[i]     = Math.min(255, Math.max(0, r));
      data[i + 1] = Math.min(255, Math.max(0, g));
      data[i + 2] = Math.min(255, Math.max(0, b));
    }

    ctx.putImageData(imageData, 0, 0);

    // Add subtle blur by drawing at a lower resolution and scaling up
    const blurCanvas = Canvas.createCanvas(width / 2, height / 2);
    const blurCtx = blurCanvas.getContext('2d');
    blurCtx.drawImage(canvas, 0, 0, width / 2, height / 2);

    ctx.drawImage(blurCanvas, 0, 0, width, height);

    // Send it
    const buffer = canvas.toBuffer('image/png');
    await message.channel.send({
      files: [{ attachment: buffer, name: 'deepfried.png' }]
    });
  }
};
