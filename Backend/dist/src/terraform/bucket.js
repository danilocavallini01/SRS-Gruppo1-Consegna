"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTerraformFiles = exports.downloadTerraform = exports.uploadTerraform = void 0;
const storage_1 = require("@google-cloud/storage");
const secrets_1 = require("../../secrets");
const fs_1 = require("fs");
const run_1 = require("./run");
// Initialize the client
const storage = new storage_1.Storage();
const destFilename = run_1.DOWNLOAD_PATH + run_1.FS + 'main.tf';
const getRandomInt = (max) => {
    return Math.floor(Math.random() * max);
};
/**
 * Upload a terraform file output under a specific user
 *
 * @param email - the user
 * @param terraformFile - the terraform file in string form
 */
const uploadTerraform = (email, terraformFile) => __awaiter(void 0, void 0, void 0, function* () {
    const folderId = getRandomInt(9999);
    (0, fs_1.writeFileSync)(`main.tf`, terraformFile);
    // Destination path in the bucket
    const destination = `${email}/${folderId}/main.tf`;
    yield storage.bucket(secrets_1.GOOGLE_SHARED_USER_BUCKET).upload(`main.tf`, {
        destination,
    });
    console.log(`Uploaded file main.tf to ${email} personal bucket`);
    return folderId;
});
exports.uploadTerraform = uploadTerraform;
const downloadTerraform = (email, folderId) => __awaiter(void 0, void 0, void 0, function* () {
    // Destination path in the bucket
    const source = `${email}/${folderId}/main.tf`;
    const options = {
        destination: destFilename,
    };
    yield storage.bucket(secrets_1.GOOGLE_SHARED_USER_BUCKET).file(source).download(options);
    console.log(`Downloaded to ${destFilename}.`);
});
exports.downloadTerraform = downloadTerraform;
/**
 * List all terraform file under a specific user email, used to show the
 * frontend user which previous terraform file he uses
 *
 * @param email
 * @returns
 */
const listTerraformFiles = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const [files] = yield storage.bucket(secrets_1.GOOGLE_SHARED_USER_BUCKET).getFiles({
        prefix: email,
    });
    return files.map(file => file.name);
});
exports.listTerraformFiles = listTerraformFiles;
