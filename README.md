# Coding challenge interview with Tks

This repo contains my respond to a coding challenge interview with Tks.
After interview started, Tarun briefly described what has to be done.

I had the option to choose between Express or NestJs for Implementing the code, I've decided to use the NestJs since I was more comfortable with it and I knew that the company I was applying to are using it and their codebase are written in Typescript, that way I could've show that I'm familiar with the NestJs ecosystem and have experience with Typescript as well.

- I have received a task from Tarun and then I started implementing it using NestJs.
- Task was pretty simple and straightforward, I had to implement two API endpoints.
- One for downloading a compressed file from a url, extracting the file on the server and then returning the contents of a text file that was inside that file.
- According to the task I had to take 8 steps for this implementation

A. make (two) api route in node Js (express/NestJs/framework) which can do the following things

0. create api routes like "/api/packages"
1. download file from this url <http://cran.r-project.org/src/contrib/PACKAGES.gz>
2. extract .gz and save file on server file system
3. read the extracted file and return data in response

B. make second api route in node js taking package name as query param

5. create api routes like "/api/package?name=packageName"
6. Now we have downloaded file content on server from above api call
7. search for the package name and return data from the file for the package "packageName"

## Part A

I've created a new module for the task and added necessary packages for finishing the task, here is the steps I had to take for it:
For the First step add a new module, service and a controller using nest cli:

```bash
nest g mo packages
nest g s packages
newst g co packages
```

> Use --no-spec flag for creating them without test files

And then added this line

```js
app.setGlobalPrefix('api');
```

to the main.ts because we had to serve our API endpoints with /api prefix

Next I had to download the zip file and I have decided to use NestJs HttpModule, I've opened this doc from NestJs website for a reference:
> <https://docs.nestjs.com/techniques/http-module>

To install necessary packages use this command

```bash
 npm i --save @nestjs/axios axios
```

And then import the HttpModule in the app.module.ts

```ts
import { HttpModule } from '@nestjs/axios';
...
@Module({
imports: [HttpModule],
...
})
```

Now we can use HttpService by injecting it in the packages.service.ts we have created earlier like this

```ts
import { HttpService } from '@nestjs/axios';
...
@Injectable()
export class PackagesService {
constructor(private httpService: HttpService) {}
...
```

Now we can Implement a function for downloading files with Axios, and this is what I came up with:

```ts
async downloadAndExtract(): Promise<string> {
try {
// Download file as a buffer
const dataBuffer = this.httpService.get(this.downloadUrl, { responseType: 'arraybuffer' });

// I have used lastvaluefrom because it converts an Observeable to a
// promise and in case of an error it will reject with error instead of
// returning an undefined value, hence we can handle error easily. it
// also takes a config option for returning a defaullt value if any 
// errors happen.

const response: AxiosResponse<ArrayBuffer> = await lastValueFrom(dataBuffer);
// Write buffer to file
await writeFile(`${this.filePath}.gz`, Buffer.from(response.data));
} catch (error) {
throw new Error(`Failed to process file: ${error}`);
}
}
```

Now we have to extract the downloaded file, NodeJs has a builtin module that can deal with the zip files called **Zlib** and we can easily extract compressed files using this module.

Here is the Implementation of the extract function:

```ts
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
```

It is fairly simple function that takes a zip file path and a destination for unzipping the file, opens a read stream for the zip file and a write stream for destination if unzipping completes without error it will resolve the promise and in case of any errors it will reject.

Now we can use this function for completing the part A for downloading and extracting the zip file from url and displaying the content to the client, here is the completed function for Downloading and Extracting the zip file:

```ts
private readonly downloadUrl = 'http://cran.r-project.org/src/contrib/PACKAGES.gz';
private readonly filePath = join(__dirname, '..', 'PACKAGES');

async downloadAndExtract(): Promise<string> {
try {
 // Download file as a buffer
 const dataBuffer = this.httpService.get(this.downloadUrl, { responseType: 'arraybuffer' });
 const response: AxiosResponse<ArrayBuffer> = await lastValueFrom(dataBuffer);
 // Write buffer to file
 await writeFile(`${this.filePath}.gz`, Buffer.from(response.data));
 // Extract the file
 await this.extractFile(`${this.filePath}.gz`, `${this.filePath}.txt`);
 // Read and return content
 return readFile(`${this.filePath}.txt`, { encoding: 'utf8' });
} catch (error) {
 throw new Error(`Failed to process file: ${error}`);
 }
}
```

## Part B

For the Second part of the task we need a function for searching inside the txt file that was extracted from the zip file, here is the implementation of this function for searching by package name:

```ts
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
```

I've read the txt file and then split it by **\n\n** and then search array to find a package by name, if package is found, return the package info and a message for not found.

Now that we have implemented the necessary functions we can serve it, here is the finished controller:

```ts
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
```
