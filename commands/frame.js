const Canvas = require('canvas');
const GIFEncoder = require('gif-encoder-2');
const { Readable } = require('stream');

module.exports = {
  name: 'frame',
  async execute(message, args) {
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

    const text = args.join(' ') || null;
    const textSize = height/4/3 * 2 - 7;

    const padding = 120; // Space between image and outer frame

    const canvas = Canvas.createCanvas(image.width + padding * 2, image.height + padding * 2);
    const ctx = canvas.getContext('2d');

    // Fill background black
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width * 2, canvas.height * 2);

    if (text) {
        ctx.fillStyle = 'white';
        ctx.font = `${textSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(text, canvas.width / 2, textSize); // Draw text in the center
    }

    // Draw white frame
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 4;
    ctx.strokeRect(padding - 2, padding - 2, image.width + 4, image.height + 4); // Slightly outside image

    // Draw the image in the center
    ctx.drawImage(image, padding, padding);

    // Create encoder and write one frame
    const encoder = new GIFEncoder(width + padding * 2, height + padding * 2);
        encoder.start();
        encoder.setRepeat(0); // 0 = loop forever
        encoder.setDelay(1000); // Frame delay in ms
        encoder.setQuality(10);
    
        encoder.addFrame(ctx);
        encoder.finish();
    
        const buffer = encoder.out.getData();
        const stream = Readable.from(buffer);
    
        message.channel.send({
          files: [{
            attachment: stream,
            name: 'test.gif'
          }]
        });
  }
};
