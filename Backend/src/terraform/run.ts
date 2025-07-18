import { GOOGLE_SHARED_USER_BUCKET } from "../../secrets";
import { downloadTerraform } from "./bucket";
const { exec } = require('child_process');

// GCloud File separator
export const FS: string = '/'

export const DOWNLOAD_PATH: string = __dirname + 'downloaded'

/**
 * Run a terraform command, under the specified user directory
 * 
 * @param command - the tf command
 * @param cwd - the path of the folder to be in
 * @returns 
 */
const runCommand = (command: string, cwd: string) => {
  return new Promise((resolve, reject) => {
    exec(command, { cwd }, (error: { message: any; }, stdout: string, stderr: any) => {
      if (error) {
        reject(stderr || error.message);
      } else {
        resolve(stdout);
      }
    });
  });
}

/**
 * Run terraform plan inside the project, and captures its output
 * 
 * @param email - the user from which run the terraform code
 * @param folderId  - the specific folder where are present the tf file to run 
 * @returns 
 */
export const plan = async (email: string, folderId: number) => {
  const output = [];

  try {
    await downloadTerraform(email, folderId)

    output.push("==== TERRAFORM INIT ====")
    output.push(await runCommand('terraform init -migrate-state -no-color', DOWNLOAD_PATH))
    await runCommand('terraform init -migrate-state -no-color', DOWNLOAD_PATH)
    output.push("==== TERRAFORM PLAN ====")
    output.push(await runCommand('terraform plan -no-color', DOWNLOAD_PATH))
    console.log("Finished doing the plan")

    return output.join('\n');
  } catch (err) {
    console.log(output)
    console.error('Error running terraform PLAN:', err);
  }
}

/**
 * Run terraform apply inside the project, and captures its output
 * 
 * @param email - the user from which run the terraform code
 * @param folderId  - the specific folder where are present the tf file to run 
 * @returns 
 */
export const apply = async (email: string, folderId: number) => {
  const output = [];

  try {
    await downloadTerraform(email, folderId)

    output.push("==== TERRAFORM APPLY ====")
    await runCommand('terraform init -migrate-state -no-color', DOWNLOAD_PATH)
    output.push(await runCommand('terraform apply -no-color -auto-approve', DOWNLOAD_PATH))
    console.log("Finished doing the apply")

    return output.join('\n');
  } catch (err) {
    console.log(output)
    console.error('Error running terraform APPLY:', err);
  }
}

/**
 * Run terraform apply inside the project, and captures its output
 * 
 * @param email - the user from which run the terraform code
 * @param folderId  - the specific folder where are present the tf file to run 
 * @returns 
 */
export const destroy = async (email: string, folderId: number) => {
  const output = [];

  try {
    await downloadTerraform(email, folderId)

    output.push("==== TERRAFORM DESTROY ====")
    await runCommand('terraform init -migrate-state -no-color', DOWNLOAD_PATH)
    await runCommand('terraform apply -no-color -auto-approve', DOWNLOAD_PATH)
    output.push(await runCommand('terraform destroy -no-color -auto-approve', DOWNLOAD_PATH))
    console.log("Finished doing the apply")

    return output.join('\n');
  } catch (err) {
    console.log(output)
    console.error('Error running terraform DESTROY:', err);
  }
}