import { Storage } from '@google-cloud/storage';
import { GOOGLE_SHARED_USER_BUCKET } from '../../secrets';
import { writeFileSync } from "fs";
import path from 'path';
import fs from 'fs';
import { DOWNLOAD_PATH, FS } from './run';

// Initialize the client
const storage = new Storage();
const destFilename = DOWNLOAD_PATH + FS + 'main.tf';


/**
 * Upload a terraform file output under a specific user
 * 
 * @param email - the user
 * @param terraformFile - the terraform file in string form 
 */
export const uploadTerraform = async (email: string, folderId: number, terraformFile: string): Promise<number> => {
    writeFileSync(`main.tf`, terraformFile)

    // Destination path in the bucket
    const destination = `${email}/${folderId}/main.tf`;

    await storage.bucket(GOOGLE_SHARED_USER_BUCKET).upload(`main.tf`, {
        destination,
    });

    console.log(`Uploaded file main.tf to ${email} personal bucket`);
    return folderId;
}

export const downloadTerraform = async (email: string, folderId: number) => {
    // Destination path in the bucket
    if (!fs.existsSync(DOWNLOAD_PATH)) {
        fs.mkdirSync(DOWNLOAD_PATH, { recursive: true });
    }
    const source = `${email}/${folderId}/main.tf`;

    const options = {
        destination: destFilename,
    };

    await storage.bucket(GOOGLE_SHARED_USER_BUCKET).file(source).download(options);
}
export const downloadTerraformState = async (email: string, folderId: number) => {
    // Destination path in the bucket
    if (!fs.existsSync(DOWNLOAD_PATH)) {
        fs.mkdirSync(DOWNLOAD_PATH, { recursive: true });
    }
    const source = `${email}/${folderId}/default.tfstate`;
    const filename = DOWNLOAD_PATH + FS + 'default.tfstate'
    const options = {
        destination: filename
    };

    await storage.bucket(GOOGLE_SHARED_USER_BUCKET).file(source).download(options);
}

export const deleteFiles = (folderPath: string = DOWNLOAD_PATH) => {
    if (!fs.existsSync(folderPath)) return;

    fs.readdirSync(folderPath).forEach((file) => {
        const curPath = path.join(folderPath, file);
        if (fs.lstatSync(curPath).isDirectory()) {
            deleteFiles(curPath); // recursive
            fs.rmdirSync(curPath);
        } else {
            fs.unlinkSync(curPath);
        }
    });
}

/**
 * List all terraform file under a specific user email, used to show the 
 * frontend user which previous terraform file he uses
 * 
 * @param email 
 * @returns 
 */
export const listTerraformFiles = async (email: string, folderId: number): Promise<string[]> => {
    const [files] = await storage.bucket(GOOGLE_SHARED_USER_BUCKET).getFiles({
        prefix: `${email}/${folderId}`,
    });

    return files.map(file => file.name);
}
