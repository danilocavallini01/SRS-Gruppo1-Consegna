import { GOOGLE_SHARED_USER_BUCKET } from "../secrets";

export const dummyTfResponse = (email: string, folderId: number): string => {
   return `
  terraform {
    required_providers {
      random = {
        source = "hashicorp/random"
        version = "3.1.0"
      }
    }
  }

  terraform {
    backend "gcs" {
      bucket  = "${GOOGLE_SHARED_USER_BUCKET}"
      prefix  = "${email}/${folderId}"
    }
  }

  resource "random_string" "random" {
    length           = 8
    special          = false
    override_special = "/@£$"
  }

  output "random-uuid" {
    value = uuid()
  }

  output "random-string" {
    value = random_string.random.id
  }`
}

const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export const generateRandomString = (length: number): string => {
    let result: string = "";
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}