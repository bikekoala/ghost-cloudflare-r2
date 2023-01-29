// eslint-disable-next-line node/no-unpublished-import
import CloudflareR2Adapter from '../src';
import {execSync} from 'child_process';
import sharp from 'sharp';
import {v4 as uuidv4} from 'uuid';

function randomColorComponent() {
  return Math.floor(Math.random() * 256);
}

/**
 * Creates a random image
 * Source: https://github.com/davidpadbury/random-image-generator/blob/master/index.js
 */
async function generateImage(width: number, height: number, path: string) {
  const buffer = Buffer.alloc(width * height * 3);

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const pixelStart = x * width * 3 + y * 3;

      buffer[pixelStart + 0] = randomColorComponent();
      buffer[pixelStart + 1] = randomColorComponent();
      buffer[pixelStart + 2] = randomColorComponent();
    }
  }

  await sharp(buffer, {
    raw: {
      width: width,
      height: height,
      channels: 3,
    },
  })
    .jpeg()
    .toFile(path);
}

function exec(command: string) {
  console.log(execSync(command).toString());
}

// Source: https://stackoverflow.com/a/1349426
function makeid(length: number) {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

let contentPrefix = '';
const yearMonth = `${new Date().getFullYear()}/${(new Date().getMonth() + 1)
  .toString()
  .padStart(2, '0')}`;

describe('post: save(): imageOptimization__resize: false, compress: false', () => {
  beforeEach(() => {
    process.env.GHOST_STORAGE_ADAPTER_R2_GHOST_RESIZE = 'false';
    contentPrefix = '/test_' + makeid(12);
  });

  afterEach(() => {
    // Restore defaults
    process.env.GHOST_STORAGE_ADAPTER_R2_IMAGES_URL_PREFIX = '/content/images/';
    process.env.GHOST_STORAGE_ADAPTER_R2_MEDIA_URL_PREFIX = '/content/media/';
    process.env.GHOST_STORAGE_ADAPTER_R2_FILES_URL_PREFIX = '/content/files/';
    process.env.GHOST_STORAGE_ADAPTER_R2_RESPONSIVE_IMAGES = 'false';
    process.env.GHOST_STORAGE_ADAPTER_R2_RESIZE_JPEG_QUALITY = '80';
    process.env.GHOST_STORAGE_ADAPTER_R2_RESIZE_WIDTHS =
      '300,600,1000,1600,400,750,960,1140,1200';
    process.env.GHOST_STORAGE_ADAPTER_R2_UUID_NAME = 'false';
    process.env.GHOST_STORAGE_ADAPTER_R2_SAVE_ORIGINAL = 'true';
    process.env.GHOST_STORAGE_ADAPTER_R2_GHOST_RESIZE = 'true';
  });

  test('save() single:', async () => {
    const adapter = new CloudflareR2Adapter({
      GHOST_STORAGE_ADAPTER_R2_CONTENT_PREFIX: contentPrefix,
    });

    const fileName = makeid(32);
    const filePath = `/tmp/${fileName}`;
    await generateImage(300, 300, filePath);

    await expect(
      adapter.exists(contentPrefix + `/content/images/${yearMonth}/snake.jpg`)
    ).resolves.toBe(false);

    await expect(
      adapter.save(
        {
          fieldname: 'file',
          originalname: 'snake.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          destination: '/tmp',
          filename: fileName,
          path: filePath,
          size: -1,
          name: 'snake.jpg',
          type: 'image/jpeg',
          ext: '.jpg',
        },
        undefined
      )
    ).resolves.toBe(
      `https://cdn.example.com${contentPrefix}/content/images/${yearMonth}/snake.jpg`
    );

    await expect(
      adapter.exists(`${contentPrefix}/content/images/${yearMonth}/snake.jpg`)
    ).resolves.toBe(true);
  });

  test('save() single: UUID_NAME: true', async () => {
    process.env.GHOST_STORAGE_ADAPTER_R2_UUID_NAME = 'true';

    const adapter = new CloudflareR2Adapter({
      GHOST_STORAGE_ADAPTER_R2_CONTENT_PREFIX: contentPrefix,
    });

    const fileName = makeid(32);
    const filePath = `/tmp/${fileName}`;
    await generateImage(300, 300, filePath);

    const uuid = uuidv4();

    await expect(
      adapter.exists(contentPrefix + `/content/images/${yearMonth}/${uuid}.jpg`)
    ).resolves.toBe(false);

    await expect(
      adapter.save(
        {
          fieldname: 'file',
          originalname: 'snake.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          destination: '/tmp',
          filename: fileName,
          path: filePath,
          size: -1,
          name: 'snake.jpg',
          type: 'image/jpeg',
          ext: '.jpg',
        },
        undefined,
        uuid
      )
    ).resolves.toBe(
      `https://cdn.example.com${contentPrefix}/content/images/${yearMonth}/${uuid}.jpg`
    );

    await expect(
      adapter.exists(`${contentPrefix}/content/images/${yearMonth}/${uuid}.jpg`)
    ).resolves.toBe(true);
  });

  test('save() single: SAVE_ORIGINAL: false', async () => {
    // SAVE_ORIGINAL has no effect since Ghost does not produce an original and a modified image

    const adapter = new CloudflareR2Adapter({
      GHOST_STORAGE_ADAPTER_R2_CONTENT_PREFIX: contentPrefix,
    });

    const fileName = makeid(32);
    const filePath = `/tmp/${fileName}`;
    await generateImage(300, 300, filePath);

    await expect(
      adapter.exists(contentPrefix + `/content/images/${yearMonth}/snake.jpg`)
    ).resolves.toBe(false);

    await expect(
      adapter.save(
        {
          fieldname: 'file',
          originalname: 'snake.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          destination: '/tmp',
          filename: fileName,
          path: filePath,
          size: -1,
          name: 'snake.jpg',
          type: 'image/jpeg',
          ext: '.jpg',
        },
        undefined
      )
    ).resolves.toBe(
      `https://cdn.example.com${contentPrefix}/content/images/${yearMonth}/snake.jpg`
    );

    await expect(
      adapter.exists(`${contentPrefix}/content/images/${yearMonth}/snake.jpg`)
    ).resolves.toBe(true);
  });

  test('save() single: RESPONSIVE_IMAGES: true', async () => {
    process.env.GHOST_STORAGE_ADAPTER_R2_RESPONSIVE_IMAGES = 'true';

    const adapter = new CloudflareR2Adapter({
      GHOST_STORAGE_ADAPTER_R2_CONTENT_PREFIX: contentPrefix,
    });

    const fileName = makeid(32);
    const filePath = `/tmp/${fileName}`;
    await generateImage(300, 300, filePath);

    await expect(
      adapter.exists(contentPrefix + `/content/images/${yearMonth}/snake.jpg`)
    ).resolves.toBe(false);

    const resizeWidths = (<string>(
      process.env.GHOST_STORAGE_ADAPTER_R2_RESIZE_WIDTHS
    ))
      .split(',')
      .map(w => parseInt(w));

    for (const w of resizeWidths) {
      await expect(
        adapter.exists(
          contentPrefix + `/content/images/size/w${w}/${yearMonth}/snake.jpg`
        )
      ).resolves.toBe(false);
    }

    await expect(
      adapter.save(
        {
          fieldname: 'file',
          originalname: 'snake.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          destination: '/tmp',
          filename: fileName,
          path: filePath,
          size: -1,
          name: 'snake.jpg',
          type: 'image/jpeg',
          ext: '.jpg',
        },
        undefined
      )
    ).resolves.toBe(
      `https://cdn.example.com${contentPrefix}/content/images/${yearMonth}/snake.jpg`
    );

    await expect(
      adapter.exists(`${contentPrefix}/content/images/${yearMonth}/snake.jpg`)
    ).resolves.toBe(true);

    for (const w of resizeWidths) {
      await expect(
        adapter.exists(
          contentPrefix + `/content/images/size/w${w}/${yearMonth}/snake.jpg`
        )
      ).resolves.toBe(true);
    }
  });

  test('save() single: RESPONSIVE_IMAGES: true, SAVE_ORIGINAL: false', async () => {
    process.env.GHOST_STORAGE_ADAPTER_R2_RESPONSIVE_IMAGES = 'true';
    process.env.GHOST_STORAGE_ADAPTER_R2_SAVE_ORIGINAL = 'false';

    const adapter = new CloudflareR2Adapter({
      GHOST_STORAGE_ADAPTER_R2_CONTENT_PREFIX: contentPrefix,
    });

    const fileName = makeid(32);
    const filePath = `/tmp/${fileName}`;
    await generateImage(300, 300, filePath);

    await expect(
      adapter.exists(contentPrefix + `/content/images/${yearMonth}/snake.jpg`)
    ).resolves.toBe(false);

    const resizeWidths = (<string>(
      process.env.GHOST_STORAGE_ADAPTER_R2_RESIZE_WIDTHS
    ))
      .split(',')
      .map(w => parseInt(w));

    for (const w of resizeWidths) {
      await expect(
        adapter.exists(
          contentPrefix + `/content/images/size/w${w}/${yearMonth}/snake.jpg`
        )
      ).resolves.toBe(false);
    }

    await expect(
      adapter.save(
        {
          fieldname: 'file',
          originalname: 'snake.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          destination: '/tmp',
          filename: fileName,
          path: filePath,
          size: -1,
          name: 'snake.jpg',
          type: 'image/jpeg',
          ext: '.jpg',
        },
        undefined
      )
    ).resolves.toBe(
      `https://cdn.example.com${contentPrefix}/content/images/${yearMonth}/snake.jpg`
    );

    await expect(
      adapter.exists(`${contentPrefix}/content/images/${yearMonth}/snake.jpg`)
    ).resolves.toBe(true);

    for (const w of resizeWidths) {
      await expect(
        adapter.exists(
          contentPrefix + `/content/images/size/w${w}/${yearMonth}/snake.jpg`
        )
      ).resolves.toBe(true);
    }
  });

  test('save() single: UUID_NAME: true, RESPONSIVE_IMAGES: true', async () => {
    process.env.GHOST_STORAGE_ADAPTER_R2_UUID_NAME = 'true';
    process.env.GHOST_STORAGE_ADAPTER_R2_RESPONSIVE_IMAGES = 'true';

    const adapter = new CloudflareR2Adapter({
      GHOST_STORAGE_ADAPTER_R2_CONTENT_PREFIX: contentPrefix,
    });

    const fileName = makeid(32);
    const filePath = `/tmp/${fileName}`;
    await generateImage(300, 300, filePath);

    const uuid = uuidv4();

    await expect(
      adapter.exists(contentPrefix + `/content/images/${yearMonth}/${uuid}.jpg`)
    ).resolves.toBe(false);

    const resizeWidths = (<string>(
      process.env.GHOST_STORAGE_ADAPTER_R2_RESIZE_WIDTHS
    ))
      .split(',')
      .map(w => parseInt(w));

    for (const w of resizeWidths) {
      await expect(
        adapter.exists(
          contentPrefix + `/content/images/size/w${w}/${yearMonth}/${uuid}.jpg`
        )
      ).resolves.toBe(false);
    }

    await expect(
      adapter.save(
        {
          fieldname: 'file',
          originalname: 'snake.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          destination: '/tmp',
          filename: fileName,
          path: filePath,
          size: -1,
          name: 'snake.jpg',
          type: 'image/jpeg',
          ext: '.jpg',
        },
        undefined,
        uuid
      )
    ).resolves.toBe(
      `https://cdn.example.com${contentPrefix}/content/images/${yearMonth}/${uuid}.jpg`
    );

    await expect(
      adapter.exists(`${contentPrefix}/content/images/${yearMonth}/${uuid}.jpg`)
    ).resolves.toBe(true);

    for (const w of resizeWidths) {
      await expect(
        adapter.exists(
          contentPrefix + `/content/images/size/w${w}/${yearMonth}/${uuid}.jpg`
        )
      ).resolves.toBe(true);
    }
  });
});

describe('post: save(): imageOptimization__resize: true, compress: false', () => {
  beforeEach(() => {
    contentPrefix = '/test_' + makeid(12);
  });

  afterEach(() => {
    // Restore defaults
    process.env.GHOST_STORAGE_ADAPTER_R2_IMAGES_URL_PREFIX = '/content/images/';
    process.env.GHOST_STORAGE_ADAPTER_R2_MEDIA_URL_PREFIX = '/content/media/';
    process.env.GHOST_STORAGE_ADAPTER_R2_FILES_URL_PREFIX = '/content/files/';
    process.env.GHOST_STORAGE_ADAPTER_R2_RESPONSIVE_IMAGES = 'false';
    process.env.GHOST_STORAGE_ADAPTER_R2_RESIZE_JPEG_QUALITY = '80';
    process.env.GHOST_STORAGE_ADAPTER_R2_RESIZE_WIDTHS =
      '300,600,1000,1600,400,750,960,1140,1200';
    process.env.GHOST_STORAGE_ADAPTER_R2_UUID_NAME = 'false';
    process.env.GHOST_STORAGE_ADAPTER_R2_SAVE_ORIGINAL = 'true';
    process.env.GHOST_STORAGE_ADAPTER_R2_GHOST_RESIZE = 'true';
  });

  test('save() single:', async () => {
    const adapter = new CloudflareR2Adapter({
      GHOST_STORAGE_ADAPTER_R2_CONTENT_PREFIX: contentPrefix,
    });

    const fileName = makeid(32);
    const filePath = `/tmp/${fileName}`;
    await generateImage(300, 300, filePath);
    await generateImage(300, 300, filePath + '_processed');

    await expect(
      adapter.exists(contentPrefix + `/content/images/${yearMonth}/snake.jpg`)
    ).resolves.toBe(false);
    await expect(
      adapter.exists(`${contentPrefix}/content/images/${yearMonth}/snake_o.jpg`)
    ).resolves.toBe(false);

    // Resized image
    await expect(
      adapter.save(
        {
          fieldname: 'file',
          originalname: 'snake.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          destination: '/tmp',
          filename: fileName,
          path: `${filePath}_processed`,
          size: -1,
          name: 'snake.jpg',
          type: 'image/jpeg',
          ext: '.jpg',
        },
        undefined
      )
    ).resolves.toBe(
      `https://cdn.example.com${contentPrefix}/content/images/${yearMonth}/snake.jpg`
    );

    await expect(
      adapter.exists(`${contentPrefix}/content/images/${yearMonth}/snake.jpg`)
    ).resolves.toBe(true);

    // Original image
    await expect(
      adapter.save(
        {
          fieldname: 'file',
          originalname: 'snake.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          destination: '/tmp',
          filename: fileName,
          path: `${filePath}`,
          size: -1,
          name: 'snake_o.jpg',
          type: 'image/jpeg',
          ext: '.jpg',
        },
        undefined
      )
    ).resolves.toBe(
      `https://cdn.example.com${contentPrefix}/content/images/${yearMonth}/snake_o.jpg`
    );

    await expect(
      adapter.exists(`${contentPrefix}/content/images/${yearMonth}/snake_o.jpg`)
    ).resolves.toBe(true);
  });

  test('save() single: UUID_NAME: true', async () => {
    process.env.GHOST_STORAGE_ADAPTER_R2_UUID_NAME = 'true';

    const adapter = new CloudflareR2Adapter({
      GHOST_STORAGE_ADAPTER_R2_CONTENT_PREFIX: contentPrefix,
    });

    const fileName = makeid(32);
    const filePath = `/tmp/${fileName}`;
    await generateImage(300, 300, filePath);
    await generateImage(300, 300, filePath + '_processed');

    const uuid = uuidv4();

    await expect(
      adapter.exists(contentPrefix + `/content/images/${yearMonth}/${uuid}.jpg`)
    ).resolves.toBe(false);
    await expect(
      adapter.exists(
        `${contentPrefix}/content/images/${yearMonth}/${uuid}_o.jpg`
      )
    ).resolves.toBe(false);

    // Resized image
    await expect(
      adapter.save(
        {
          fieldname: 'file',
          originalname: 'snake.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          destination: '/tmp',
          filename: fileName,
          path: `${filePath}_processed`,
          size: -1,
          name: 'snake.jpg',
          type: 'image/jpeg',
          ext: '.jpg',
        },
        undefined,
        uuid
      )
    ).resolves.toBe(
      `https://cdn.example.com${contentPrefix}/content/images/${yearMonth}/${uuid}.jpg`
    );

    await expect(
      adapter.exists(`${contentPrefix}/content/images/${yearMonth}/${uuid}.jpg`)
    ).resolves.toBe(true);

    // Original image
    const uuid_orig = uuidv4();
    await expect(
      adapter.save(
        {
          fieldname: 'file',
          originalname: 'snake.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          destination: '/tmp',
          filename: fileName,
          path: `${filePath}`,
          size: -1,
          name: 'snake_o.jpg',
          type: 'image/jpeg',
          ext: '.jpg',
        },
        undefined,
        uuid_orig
      )
    ).resolves.toBe(
      `https://cdn.example.com${contentPrefix}/content/images/${yearMonth}/${uuid_orig}.jpg`
    );

    await expect(
      adapter.exists(
        `${contentPrefix}/content/images/${yearMonth}/${uuid_orig}.jpg`
      )
    ).resolves.toBe(true);
  });

  test('save() single: SAVE_ORIGINAL: false', async () => {
    process.env.GHOST_STORAGE_ADAPTER_R2_SAVE_ORIGINAL = 'false';

    const adapter = new CloudflareR2Adapter({
      GHOST_STORAGE_ADAPTER_R2_CONTENT_PREFIX: contentPrefix,
    });

    const fileName = makeid(32);
    const filePath = `/tmp/${fileName}`;
    await generateImage(300, 300, filePath);
    await generateImage(300, 300, filePath + '_processed');

    await expect(
      adapter.exists(contentPrefix + `/content/images/${yearMonth}/snake.jpg`)
    ).resolves.toBe(false);
    await expect(
      adapter.exists(`${contentPrefix}/content/images/${yearMonth}/snake_o.jpg`)
    ).resolves.toBe(false);

    // Resized image
    await expect(
      adapter.save(
        {
          fieldname: 'file',
          originalname: 'snake.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          destination: '/tmp',
          filename: fileName,
          path: `${filePath}_processed`,
          size: -1,
          name: 'snake.jpg',
          type: 'image/jpeg',
          ext: '.jpg',
        },
        undefined
      )
    ).resolves.toBe(
      `https://cdn.example.com${contentPrefix}/content/images/${yearMonth}/snake.jpg`
    );

    await expect(
      adapter.exists(`${contentPrefix}/content/images/${yearMonth}/snake.jpg`)
    ).resolves.toBe(true);

    // Original image
    await expect(
      adapter.save(
        {
          fieldname: 'file',
          originalname: 'snake.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          destination: '/tmp',
          filename: fileName,
          path: `${filePath}`,
          size: -1,
          name: 'snake_o.jpg',
          type: 'image/jpeg',
          ext: '.jpg',
        },
        undefined
      )
    ).resolves.toBe('');

    await expect(
      adapter.exists(`${contentPrefix}/content/images/${yearMonth}/snake_o.jpg`)
    ).resolves.toBe(false);
  });

  test('save() single: RESPONSIVE_IMAGES: true', async () => {
    process.env.GHOST_STORAGE_ADAPTER_R2_RESPONSIVE_IMAGES = 'true';

    const adapter = new CloudflareR2Adapter({
      GHOST_STORAGE_ADAPTER_R2_CONTENT_PREFIX: contentPrefix,
    });

    const fileName = makeid(32);
    const filePath = `/tmp/${fileName}`;
    await generateImage(300, 300, filePath);
    await generateImage(300, 300, filePath + '_processed');

    await expect(
      adapter.exists(contentPrefix + `/content/images/${yearMonth}/snake.jpg`)
    ).resolves.toBe(false);

    const resizeWidths = (<string>(
      process.env.GHOST_STORAGE_ADAPTER_R2_RESIZE_WIDTHS
    ))
      .split(',')
      .map(w => parseInt(w));

    for (const w of resizeWidths) {
      await expect(
        adapter.exists(
          contentPrefix + `/content/images/size/w${w}/${yearMonth}/snake.jpg`
        )
      ).resolves.toBe(false);
      await expect(
        adapter.exists(
          contentPrefix + `/content/images/size/w${w}/${yearMonth}/snake_o.jpg`
        )
      ).resolves.toBe(false);
    }

    await expect(
      adapter.save(
        {
          fieldname: 'file',
          originalname: 'snake.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          destination: '/tmp',
          filename: fileName,
          path: `${filePath}_processed`,
          size: -1,
          name: 'snake.jpg',
          type: 'image/jpeg',
          ext: '.jpg',
        },
        undefined
      )
    ).resolves.toBe(
      `https://cdn.example.com${contentPrefix}/content/images/${yearMonth}/snake.jpg`
    );

    await expect(
      adapter.exists(`${contentPrefix}/content/images/${yearMonth}/snake.jpg`)
    ).resolves.toBe(true);

    await expect(
      adapter.save(
        {
          fieldname: 'file',
          originalname: 'snake.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          destination: '/tmp',
          filename: fileName,
          path: `${filePath}`,
          size: -1,
          name: 'snake_o.jpg',
          type: 'image/jpeg',
          ext: '.jpg',
        },
        undefined
      )
    ).resolves.toBe(
      `https://cdn.example.com${contentPrefix}/content/images/${yearMonth}/snake_o.jpg`
    );

    await expect(
      adapter.exists(`${contentPrefix}/content/images/${yearMonth}/snake_o.jpg`)
    ).resolves.toBe(true);

    for (const w of resizeWidths) {
      await expect(
        adapter.exists(
          contentPrefix + `/content/images/size/w${w}/${yearMonth}/snake.jpg`
        )
      ).resolves.toBe(true);

      await expect(
        adapter.exists(
          contentPrefix + `/content/images/size/w${w}/${yearMonth}/snake_o.jpg`
        )
      ).resolves.toBe(false);
    }
  });

  test('save() single: RESPONSIVE_IMAGES: true, SAVE_ORIGINAL: false', async () => {
    process.env.GHOST_STORAGE_ADAPTER_R2_RESPONSIVE_IMAGES = 'true';
    process.env.GHOST_STORAGE_ADAPTER_R2_SAVE_ORIGINAL = 'false';

    const adapter = new CloudflareR2Adapter({
      GHOST_STORAGE_ADAPTER_R2_CONTENT_PREFIX: contentPrefix,
    });

    const fileName = makeid(32);
    const filePath = `/tmp/${fileName}`;
    await generateImage(300, 300, filePath);
    await generateImage(300, 300, filePath + '_processed');

    await expect(
      adapter.exists(contentPrefix + `/content/images/${yearMonth}/snake.jpg`)
    ).resolves.toBe(false);

    const resizeWidths = (<string>(
      process.env.GHOST_STORAGE_ADAPTER_R2_RESIZE_WIDTHS
    ))
      .split(',')
      .map(w => parseInt(w));

    for (const w of resizeWidths) {
      await expect(
        adapter.exists(
          contentPrefix + `/content/images/size/w${w}/${yearMonth}/snake.jpg`
        )
      ).resolves.toBe(false);
      await expect(
        adapter.exists(
          contentPrefix + `/content/images/size/w${w}/${yearMonth}/snake_o.jpg`
        )
      ).resolves.toBe(false);
    }

    await expect(
      adapter.save(
        {
          fieldname: 'file',
          originalname: 'snake.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          destination: '/tmp',
          filename: fileName,
          path: `${filePath}_processed`,
          size: -1,
          name: 'snake.jpg',
          type: 'image/jpeg',
          ext: '.jpg',
        },
        undefined
      )
    ).resolves.toBe(
      `https://cdn.example.com${contentPrefix}/content/images/${yearMonth}/snake.jpg`
    );

    await expect(
      adapter.exists(`${contentPrefix}/content/images/${yearMonth}/snake.jpg`)
    ).resolves.toBe(true);

    await expect(
      adapter.save(
        {
          fieldname: 'file',
          originalname: 'snake.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          destination: '/tmp',
          filename: fileName,
          path: `${filePath}`,
          size: -1,
          name: 'snake_o.jpg',
          type: 'image/jpeg',
          ext: '.jpg',
        },
        undefined
      )
    ).resolves.toBe(``);

    await expect(
      adapter.exists(`${contentPrefix}/content/images/${yearMonth}/snake_o.jpg`)
    ).resolves.toBe(false);

    for (const w of resizeWidths) {
      await expect(
        adapter.exists(
          contentPrefix + `/content/images/size/w${w}/${yearMonth}/snake.jpg`
        )
      ).resolves.toBe(true);

      await expect(
        adapter.exists(
          contentPrefix + `/content/images/size/w${w}/${yearMonth}/snake_o.jpg`
        )
      ).resolves.toBe(false);
    }
  });

  test('save() single: UUID_NAME: true, RESPONSIVE_IMAGES: true', async () => {
    process.env.GHOST_STORAGE_ADAPTER_R2_UUID_NAME = 'true';
    process.env.GHOST_STORAGE_ADAPTER_R2_RESPONSIVE_IMAGES = 'true';

    const adapter = new CloudflareR2Adapter({
      GHOST_STORAGE_ADAPTER_R2_CONTENT_PREFIX: contentPrefix,
    });

    const fileName = makeid(32);
    const filePath = `/tmp/${fileName}`;
    await generateImage(300, 300, filePath);
    await generateImage(300, 300, filePath + '_processed');

    const uuid = uuidv4();

    await expect(
      adapter.exists(contentPrefix + `/content/images/${yearMonth}/${uuid}.jpg`)
    ).resolves.toBe(false);

    const resizeWidths = (<string>(
      process.env.GHOST_STORAGE_ADAPTER_R2_RESIZE_WIDTHS
    ))
      .split(',')
      .map(w => parseInt(w));

    for (const w of resizeWidths) {
      await expect(
        adapter.exists(
          contentPrefix + `/content/images/size/w${w}/${yearMonth}/${uuid}.jpg`
        )
      ).resolves.toBe(false);
      await expect(
        adapter.exists(
          contentPrefix +
            `/content/images/size/w${w}/${yearMonth}/${uuid}_o.jpg`
        )
      ).resolves.toBe(false);
    }

    await expect(
      adapter.save(
        {
          fieldname: 'file',
          originalname: 'snake.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          destination: '/tmp',
          filename: fileName,
          path: `${filePath}_processed`,
          size: -1,
          name: 'snake.jpg',
          type: 'image/jpeg',
          ext: '.jpg',
        },
        undefined,
        uuid
      )
    ).resolves.toBe(
      `https://cdn.example.com${contentPrefix}/content/images/${yearMonth}/${uuid}.jpg`
    );

    await expect(
      adapter.exists(`${contentPrefix}/content/images/${yearMonth}/${uuid}.jpg`)
    ).resolves.toBe(true);

    const origUuid = uuidv4();
    await expect(
      adapter.save(
        {
          fieldname: 'file',
          originalname: 'snake.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          destination: '/tmp',
          filename: fileName,
          path: `${filePath}`,
          size: -1,
          name: 'snake_o.jpg',
          type: 'image/jpeg',
          ext: '.jpg',
        },
        undefined,
        origUuid
      )
    ).resolves.toBe(
      `https://cdn.example.com${contentPrefix}/content/images/${yearMonth}/${origUuid}.jpg`
    );

    await expect(
      adapter.exists(
        `${contentPrefix}/content/images/${yearMonth}/${origUuid}.jpg`
      )
    ).resolves.toBe(true);

    for (const w of resizeWidths) {
      await expect(
        adapter.exists(
          contentPrefix + `/content/images/size/w${w}/${yearMonth}/${uuid}.jpg`
        )
      ).resolves.toBe(true);

      await expect(
        adapter.exists(
          contentPrefix +
            `/content/images/size/w${w}/${yearMonth}/${origUuid}.jpg`
        )
      ).resolves.toBe(false);
    }
  });
});