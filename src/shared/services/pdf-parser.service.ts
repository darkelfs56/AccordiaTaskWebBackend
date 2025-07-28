import { Injectable } from '@nestjs/common';
import * as pdfParse from 'pdf-parse';

@Injectable()
export class PdfService {
  async extractText(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      return data.text; // Contains extracted text
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      throw new Error('Failed to parse PDF');
    }
  }
}
