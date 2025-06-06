declare module 'quagga' {
  interface QuaggaJSConfigObject {
    inputStream?: {
      name?: string;
      type?: string;
      target?: HTMLElement;
      constraints?: {
        width?: number;
        height?: number;
        facingMode?: string;
      };
    };
    decoder?: {
      readers?: string[];
      debug?: {
        drawBoundingBox?: boolean;
        showFrequency?: boolean;
        drawScanline?: boolean;
        showPattern?: boolean;
      };
    };
    locate?: boolean;
    locator?: {
      patchSize?: string;
      halfSample?: boolean;
    };
  }

  interface QuaggaJSResultObject {
    codeResult?: {
      code: string;
    };
  }

  export function init(config: QuaggaJSConfigObject, callback: (err: any) => void): void;
  export function start(): void;
  export function stop(): void;
  export function decodeSingle(config: QuaggaJSConfigObject, callback: (result: QuaggaJSResultObject) => void): void;
  export function onDetected(callback: (result: QuaggaJSResultObject) => void): void;
} 