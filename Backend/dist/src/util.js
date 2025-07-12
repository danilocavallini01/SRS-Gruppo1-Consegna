"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomString = exports.dummyTfResponse = void 0;
exports.dummyTfResponse = `terraform {
  required_providers {
    random = {
      source = "hashicorp/random"
      version = "3.1.0"
    }
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
}
`;
const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const generateRandomString = (length) => {
    let result = "";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
};
exports.generateRandomString = generateRandomString;
