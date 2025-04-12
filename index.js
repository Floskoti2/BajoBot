// Import required libraries
const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');

//const { cssColorToHex } = require ('@jimp/utils');

// Create a new Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Configuration options
const PREFIX = '!';
const TEMP_DIR = './temp';

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR);
}

// Bot ready event
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// Process messages
client.on('messageCreate', async (message) => {
  // Ignore bot messages
  if (message.author.bot) return;

  // Process commands
  if (message.content.startsWith(PREFIX)) {
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Process image editing commands
    if (command === 'addtext' && message.attachments.size > 0) {
      const attachment = message.attachments.first();
      message.reply(attachment);
      if (!attachment || !isImageFile(attachment.name)) {
        return message.reply('Please attach a valid image file.');
      }

      // Get the text to add
      const textToAdd = args.join(' ');
      if (!textToAdd) {
        return message.reply('Please provide text to add to the image.');
      }
    }
    else if (command === 'textabove' && message.attachments.size > 0) {
        console.log("message.attachments");
        console.log(message.attachments);
        const attachment = message.attachments.first();
        console.log("attachment");
        console.log(attachment);
        if (!attachment || !isImageFile(attachment.name)) {
          return message.reply('Please attach a valid image file.');
        }
      
        // Parse arguments
        let textHeight = 80; // Default text area height
        let textColor = '#000000'; // Default text color
        let backgroundColor = '#FFFFFF'; // Default background color
        let textContent = '';
        
        // Extract parameters if provided
        for (let i = 0; i < args.length; i++) {
          const arg = args[i];
          if (arg.startsWith('height=')) {
            textHeight = parseInt(arg.split('=')[1]) || 80;
          } else if (arg.startsWith('textcolor=')) {
            textColor = arg.split('=')[1] || '#000000';
          } else if (arg.startsWith('bgcolor=')) {
            backgroundColor = arg.split('=')[1] || '#FFFFFF';
          } else {
            // If not a parameter, it's part of the text
            if (textContent) textContent += ' ';
            textContent += arg;
          }
        }
        
        if (!textContent) {
          return message.reply('Please provide text to add above the image. Usage: `!image textabove [text] height=80 bgcolor=#FFFFFF textcolor=#000000`');
        }
      
        try {
          await message.channel.sendTyping();
          console.log("attachment");
          console.log(attachment);
          const editedImage = await addTextAboveImage(attachment.url, textContent, textHeight, textColor, backgroundColor);
          outputAttachment  = new AttachmentBuilder(editedImage, { name: 'text-above.png' });
          message.reply({ content: 'Here\'s your image with text above:', files: [outputAttachment] });
        } catch (error) {
          console.error('Error processing image:', error);
          message.reply('There was an error processing your image.');
        }
      }
    else if (command === 'addwhitespace' && message.attachments.size > 0) {
        const attachment = message.attachments.first();
        if (!attachment || !isImageFile(attachment.name)) {
          return message.reply('Please attach a valid image file.');
        }
      
        // Get the text to add and optional height
        const heightArg = args.find(arg => arg.startsWith('height='));
        let height = 100; // Default height
        let textArgs = [...args];
        
        if (heightArg) {
          height = parseInt(heightArg.split('=')[1]) || 100;
          textArgs = args.filter(arg => arg !== heightArg);
        }
        
        const textToAdd = textArgs.join(' ');
        if (!textToAdd) {
          return message.reply('Please provide text to add to the whitespace.');
        }
      
        try {
          await message.channel.sendTyping();
          const editedImage = await addTopWhitespaceWithText(attachment.url, textToAdd, height);
          const outputAttachment2 = new AttachmentBuilder(editedImage, { name: 'whitespace-added.png' });
          message.reply({ content: 'Here\'s your image with added whitespace and text:', files: [outputAttachment2] });
        } catch (error) {
          console.error('Error processing image:', error);
          message.reply('There was an error processing your image.');
        }
      }
    else if (command === 'help') {
      const helpMessage = `
**Image Editor Bot Commands:**
• \`${PREFIX} addtext [your text]\` - Add text to the whitespace at the top of an attached image
• \`${PREFIX} removewhitespace\` - Remove whitespace from the top of an attached image
• \`${PREFIX} help\` - Show this help message

Please attach an image when using the editing commands.
      `;
      message.reply(helpMessage);
    }
  }
});

/**
 * Add whitespace to the top of an image and add text to it
 * @param {string} imageUrl - URL of the image to process
 * @param {string} text - Text to add to the whitespace
 * @param {number} whitespaceHeight - Height of whitespace to add (in pixels)
 * @returns {Promise<Buffer>} - Buffer containing the edited image
 */
async function addTextAboveImage(imageUrl, text, textHeight = 80, textColor = '#000000', backgroundColor = '#FFFFFF') {
    // Load the image
    console.log("imageUrl");
    console.log(imageUrl);
    const image = await Jimp.read(imageUrl);
    
    // Create a new image with additional height for text
    console.log("image");
    console.log(image);
    const width = image.bitmap.width;
    const originalHeight = image.bitmap.height;
    const newHeight = originalHeight + textHeight;
    
    // Create new canvas with background color
    console.log("bunga bunga o bunga");
    const newImage = new Jimp(width, newHeight, backgroundColor);
    onsole.log(newImage);
    // Paste the original image below the text area
    newImage.composite(image, 0, textHeight);
    
    // Choose appropriate font size based on text area height
    let fontPath;
    if (textHeight >= 64) {
      fontPath = Jimp.FONT_SANS_32_BLACK;
    } else if (textHeight >= 32) {
      fontPath = Jimp.FONT_SANS_16_BLACK;
    } else {
      fontPath = Jimp.FONT_SANS_8_BLACK;
    }
    
    // Load font
    const font = await Jimp.loadFont(fontPath);
    
    // Handle text color (we can't directly change font color in Jimp without custom fonts,
    // so we'll use this method for black fonts only)
    
    // Calculate text position (centered in the text area)
    let textX = 10; // Default left padding
    let textY = textHeight / 2 - Jimp.measureTextHeight(font, text, width - 20) / 2;
    
    // If text is too long, consider text wrapping
    const measuredWidth = Jimp.measureText(font, text);
    if (measuredWidth > width - 20) {
      // Center text with word wrapping
      textX = (width - (width - 20)) / 2;
      textY = 10; // Top padding
    }
    
    // Add text to the image
    newImage.print(
      font,
      textX,
      textY,
      {
        text: text,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
      },
      width - 20,
      textHeight - 20
    );
    
    // Return the modified image as a buffer
    return await newImage.getBufferAsync(Jimp.MIME_PNG);
  }

// Add this command to your client.on('messageCreate') handler:

  /*
  // Update the help command to include the new feature
  else if (command === 'help') {
    const helpMessage = `
  **Image Editor Bot Commands:**
  • \`${PREFIX} addtext [your text]\` - Add text to existing whitespace at the top of an attached image
  • \`${PREFIX} removewhitespace\` - Remove whitespace from the top of an attached image
  • \`${PREFIX} addwhitespace [your text] height=100\` - Add whitespace to the top of an image with text
  • \`${PREFIX} textabove [your text] height=80 bgcolor=#FFFFFF textcolor=#000000\` - Add text above an image
  • \`${PREFIX} help\` - Show this help message
  
  Please attach an image when using the editing commands.
    `;
    message.reply(helpMessage);
  }

*/

/**
 * Check if a file is an image based on its extension
 * @param {string} filename - The filename to check
 * @returns {boolean} - Whether the file appears to be an image
 */
function isImageFile(filename) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(filename).toLowerCase();
  return imageExtensions.includes(ext);
}

client.login("ODAxNDAzNjYxMzk3MDAwMjMy.GcuE_C.oIJ9RdoO9XR8M7eHbeOLpQoId1_oXcRRXma7BE");