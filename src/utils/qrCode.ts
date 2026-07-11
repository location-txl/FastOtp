import jsQR from 'jsqr';

const MAX_IMAGE_SIDE = 3000;
const SUPPORTED_IMAGE_DATA_URL = /^data:image\/(?:png|jpe?g|webp|bmp|gif);base64,/i;

const loadImage = (source: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('图片读取失败，请选择 PNG、JPG、JPEG、WebP、BMP 或 GIF 图片'));
    image.src = source;
  });

export const getQrImageSource = (payload: unknown): string => {
  const source = typeof payload === 'string'
    ? payload
    : payload && typeof payload === 'object' && 'data' in payload
      ? (payload as { data?: unknown }).data
      : undefined;

  if (typeof source !== 'string' || !source.trim()) {
    throw new Error('没有读取到剪贴板图片');
  }

  const value = source.trim();
  if (SUPPORTED_IMAGE_DATA_URL.test(value)) {
    return value;
  }

  if (value.startsWith('data:image/')) {
    throw new Error('不支持的剪贴板图片格式');
  }

  // 兼容部分 uTools 版本直接传入不带 Data URL 头的 base64 数据。
  const cleanValue = value.replace(/\s/g, '');
  if (/^[A-Za-z0-9+/=]+$/.test(cleanValue) && cleanValue.length > 100) {
    return `data:image/png;base64,${cleanValue}`;
  }

  throw new Error('剪贴板中的内容不是有效图片');
};

export const decodeOtpUriFromQrImage = async (source: string): Promise<string> => {
  const image = await loadImage(source);
  const naturalWidth = image.naturalWidth || image.width;
  const naturalHeight = image.naturalHeight || image.height;

  if (!naturalWidth || !naturalHeight) {
    throw new Error('图片尺寸无效');
  }

  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(naturalWidth, naturalHeight));
  const width = Math.max(1, Math.round(naturalWidth * scale));
  const height = Math.max(1, Math.round(naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    throw new Error('当前环境不支持图片解析');
  }

  context.drawImage(image, 0, 0, width, height);
  const imageData = context.getImageData(0, 0, width, height);
  const result = jsQR(imageData.data, width, height, {
    inversionAttempts: 'attemptBoth',
  });

  if (!result?.data) {
    throw new Error('图片中未识别到二维码');
  }

  const value = result.data.trim();
  if (!value.toLowerCase().startsWith('otpauth://')) {
    throw new Error('识别到的二维码不是 OTP 验证器二维码');
  }

  return value;
};
