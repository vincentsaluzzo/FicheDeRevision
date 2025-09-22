declare module 'pdfkit' {
  import { Readable } from 'stream';

  export namespace PDFKit {
    interface PDFDocumentOptions {
      size?: string | [number, number];
      margins?: {
        top?: number;
        left?: number;
        bottom?: number;
        right?: number;
      };
    }
  }

  class PDFDocument extends Readable {
    constructor(options?: PDFKit.PDFDocumentOptions);
    font(id: string): this;
    fontSize(size: number): this;
    fillColor(color: string): this;
    text(text: string, options?: any): this;
    moveDown(lines?: number): this;
    strokeColor(color: string): this;
    lineWidth(width: number): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    stroke(): this;
    image(src: string, options?: any): this;
    pipe<T extends NodeJS.WritableStream>(destination: T): T;
    end(): void;
    readonly page: {
      width: number;
      height: number;
      margins: {
        top: number;
        left: number;
        bottom: number;
        right: number;
      };
    };
    y: number;
  }

  export = PDFDocument;
}
