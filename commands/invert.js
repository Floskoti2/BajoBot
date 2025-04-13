const Canvas = require('canvas');

module.exports = {
  name: 'invert',
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

    // Flip image vertically
    ctx.translate(0, height);
    ctx.scale(1, -1);
    ctx.drawImage(image, 0, 0, width, height);

    // Invert pixel colors
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      data[i]     = 255 - data[i];     // Red
      data[i + 1] = 255 - data[i + 1]; // Green
      data[i + 2] = 255 - data[i + 2]; // Blue
      // Alpha stays the same
    }

    ctx.putImageData(imageData, 0, 0);

    const buffer = canvas.toBuffer('image/png');
    await message.channel.send({
      files: [{ attachment: buffer, name: 'inverted.png' }]
    });
  }
};
