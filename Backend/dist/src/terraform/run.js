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
exports.apply = exports.plan = exports.DOWNLOAD_PATH = exports.FS = void 0;
const bucket_1 = require("./bucket");
const { exec } = require('child_process');
// GCloud File separator
exports.FS = '/';
exports.DOWNLOAD_PATH = __dirname + exports.FS + '..' + exports.FS + 'downloaded';
/**
 * Run a terraform command, under the specified user directory
 *
 * @param command - the tf command
 * @param cwd - the path of the folder to be in
 * @returns
 */
const runCommand = (command, cwd) => {
    return new Promise((resolve, reject) => {
        exec(command, { cwd }, (error, stdout, stderr) => {
            if (error) {
                reject(stderr || error.message);
            }
            else {
                resolve(stdout);
            }
        });
    });
};
/**
 * Run terraform plan inside the project, and captures its output
 *
 * @param email - the user from which run the terraform code
 * @param folderId  - the specific folder where are present the tf file to run
 * @returns
 */
const plan = (email, folderId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const output = [];
        (0, bucket_1.downloadTerraform)(email, folderId);
        output.push("==== TERRAFORM INIT ====");
        output.push(yield runCommand('terraform init -no-color', exports.DOWNLOAD_PATH));
        output.push("==== TERRAFORM PLAN ====");
        output.push(yield runCommand('terraform plan -no-color', exports.DOWNLOAD_PATH));
        console.log("finished doing the plan");
        return output.join('\n');
    }
    catch (err) {
        console.error('Error running Terraform:', err);
    }
});
exports.plan = plan;
/**
 * Run terraform apply inside the project, and captures its output
 *
 * @param email - the user from which run the terraform code
 * @param folderId  - the specific folder where are present the tf file to run
 * @returns
 */
const apply = (email, folderId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const output = [];
        (0, bucket_1.downloadTerraform)(email, folderId);
        output.push("==== TERRAFORM APPLY ====");
        yield runCommand('terraform init -no-color', exports.DOWNLOAD_PATH);
        output.push(yield runCommand('terraform apply -no-color -auto-approve', exports.DOWNLOAD_PATH));
        console.log("finished doing the apply");
        return output.join('\n');
    }
    catch (err) {
        console.error('Error running Terraform:', err);
    }
});
exports.apply = apply;
