const Canvas = require('canvas');

module.exports = {
  name: 'distort',
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

    const sliceHeight = 4;

    for (let y = 0; y < height; y += sliceHeight) {
      const offset = Math.sin(y / 20) * 10; // Distortion strength
      ctx.drawImage(image,
        0, y, width, sliceHeight,       // Source slice
        offset, y, width, sliceHeight   // Destination with offset
      );
    }

    const buffer = canvas.toBuffer('image/png');
    await message.channel.send({
      files: [{ attachment: buffer, name: 'distorted.png' }]
    });
  }
};
