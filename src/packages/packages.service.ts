import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { createReadStream, createWriteStream } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { createInterface } from 'readline';
import { lastValueFrom } from 'rxjs';
import { createGunzip } from 'zlib';

@Injectable()
export class PackagesService {
  private readonly downloadUrl =
    'http://cran.r-project.org/src/contrib/PACKAGES.gz';
  private readonly filePath = join(__dirname, '..', 'PACKAGES');

  constructor(private httpService: HttpService) {}

    async downloadAndExtract(): Promise<string> {
    try {
      // Download file as a buffer
      const dataBuffer = this.httpService.get(this.downloadUrl, { responseType: 'arraybuffer' });
      const response: AxiosResponse<ArrayBuffer> = await lastValueFrom(dataBuffer);

      // Write buffer to file
      await writeFile(`${this.filePath}.gz`, Buffer.from(response.data));

      // Extract the file
      await this.extractFile2(`${this.filePath}.gz`, `${this.filePath}.txt`);

      // Read and return content
      return readFile(`${this.filePath}.txt`, { encoding: 'utf8' });
    } catch (error) {
      throw new Error(`Failed to process file: ${error}`);
    }
  }

  private async extractFile(srcPath: string, destPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const src = createReadStream(srcPath);
      const dest = createWriteStream(destPath);
      const gunzip = createGunzip();

      src.pipe(gunzip).pipe(dest);

      dest.on('finish', resolve);
      dest.on('error', reject);
      gunzip.on('error', reject);
      src.on('error', reject);
    });
  }

  async downloadAndExtract2(): Promise<string> {
    // Download file as a buffer
    const dataBuffer = this.httpService.get(this.downloadUrl, {
      responseType: 'arraybuffer',
    });
    const response = await lastValueFrom(dataBuffer);

    // Write buffer to file
    await writeFile(this.filePath + '.gz', response.data);

    // Extract without using pipe()
    await this.extractFile2(this.filePath + '.gz', this.filePath + '.txt');

    // Read and return content
    return readFile(this.filePath + '.txt', { encoding: 'utf8' });
  }

  private async extractFile2(srcPath: string, destPath: string) {
    await new Promise((resolve, reject) => {
      const src = createReadStream(srcPath);
      const dest = createWriteStream(destPath);
      const gunzip = createGunzip();

      src.on('error', reject);
      dest.on('error', reject);
      dest.on('finish', resolve);

      src.on('data', (chunk) => gunzip.write(chunk));
      gunzip.on('data', (chunk) => dest.write(chunk));

      src.on('end', () => {
        gunzip.end();
        dest.end();
      });
    });
  }
  async findPackageByName(packageName: string) {
    const fileStream = createReadStream(this.filePath + '.txt', {
      encoding: 'utf8',
    });
    const reader = createInterface({ input: fileStream });

    let isCapturing = false;
    let packageDetails = '';

    for await (const line of reader) {
      if (line.startsWith(`Package: ${packageName}`)) {
        isCapturing = true;
        packageDetails = line + '\n'; // start capturing the details
      } else if (line.startsWith('Package: ') && isCapturing) {
        break; // stop capturing when the next package starts
      } else if (isCapturing) {
        packageDetails += line + '\n'; // continue capturing the details
      }
      if (line.startsWith('\n')) break;
    }

    return packageDetails || `Package ${packageName} not found.`;
  }

  async findPackageByName2(packageName: string): Promise<string> {
    // Read the file content
    const fileContent = await readFile(this.filePath+'.txt', { encoding: 'utf8' });
    const packages = fileContent.split('\n\n');

    // Search for the specified package
    const packageDetails = packages.find((pkgDetail) => {
      return pkgDetail.startsWith(`Package: ${packageName}\n`);
    });

    return packageDetails || `Package ${packageName} not found.`;
  }
}
