import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { PackagesService } from './packages.service';

@Controller()
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Get('packages')
  async downloadAndExtract(@Res() res: Response) {
    try {
      const content = await this.packagesService.downloadAndExtract();
      res.send(content);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'An error occurred.' });
    }
  }

  @Get('package')
  async getPackage(@Query('name') name: string, @Res() res: Response) {
    if (!name) {
      return res.status(400).json({ message: 'Package name is required.' });
    }
    try {
      const packageDetails = await this.packagesService.findPackageByName2(name);
      if (packageDetails.startsWith('Package not found')) {
        res.status(404).json({ message: packageDetails });
      } else {
        res.send(packageDetails);
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'An error occurred.' });
    }
  }
}
