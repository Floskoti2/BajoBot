const Canvas = require('canvas');
const GIFEncoder = require('gif-encoder-2');
const { Readable } = require('stream');

module.exports = {
  name: 'uncaption',
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
    const canvas = Canvas.createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data, width, height } = imgData;

    const isWhite = (r, g, b, a, tolerance = 15) => {
      return (
        a > 0 &&
        r >= 255 - tolerance &&
        g >= 255 - tolerance &&
        b >= 255 - tolerance
      );
    };

    let cropTop = 0;
    let threshold = 0.40; // % of white pixels across width to consider a row as "white space"
    const scanHeight = Math.floor(height * 0.5); // scan only top half

    for (let y = 0; y < scanHeight; y++) {
      let whitePixels = 0;
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        if (isWhite(r, g, b, a)) whitePixels++;
      }
      const whiteRatio = whitePixels / width;

      if (whiteRatio < threshold) {
        cropTop = y;
        break;
      }
    }

    const croppedHeight = height - cropTop;
    const outputCanvas = Canvas.createCanvas(width, croppedHeight);
    const outputCtx = outputCanvas.getContext('2d');
    outputCtx.drawImage(image, 0, cropTop, width, croppedHeight, 0, 0, width, croppedHeight);

    // Create encoder and write one frame
    const encoder = new GIFEncoder(width, croppedHeight);
    encoder.start();
    encoder.setRepeat(0); // 0 = loop forever
    encoder.setDelay(1000); // Frame delay in ms
    encoder.setQuality(10);
    
    encoder.addFrame(outputCtx); // Use outputCtx which has the cropped image
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