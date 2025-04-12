const Canvas = require('canvas');
const GIFEncoder = require('gif-encoder-2');
const { Readable } = require('stream');

module.exports = {
  name: 'test',
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

    const padding = 100;
    const textHeight = 40;
    const width = image.width + padding * 2;
    const height = image.height + padding * 2 + textHeight;

    const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const text = args.join(' ');

    // Draw background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    // Draw text if any
    if (text) {
      ctx.fillStyle = 'white';
      ctx.font = `${textHeight * 0.6}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(text, width / 2, textHeight * 0.8);
    }

    // Draw frame
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 4;
    ctx.strokeRect(padding - 2, padding + textHeight - 2, image.width + 4, image.height + 4);

    // Draw image
    ctx.drawImage(image, padding, padding + textHeight);

    // Create encoder and write one frame
    const encoder = new GIFEncoder(width, height);
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
