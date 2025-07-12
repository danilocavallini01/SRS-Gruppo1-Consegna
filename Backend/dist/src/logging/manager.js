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
exports.getLoggedChat = exports.logChat = void 0;
const logging_1 = require("@google-cloud/logging");
const logging = new logging_1.Logging();
const log = logging.log('ai-chat');
const logChat = (email, requestData, responseData) => __awaiter(void 0, void 0, void 0, function* () {
    const metadata = {
        resource: { type: 'global' },
        severity: 'INFO',
        labels: {
            email: email,
        }
    };
    const entry = log.entry(metadata, {
        timestamp: new Date(),
        request: requestData,
        response: responseData,
    });
    yield log.write(entry);
});
exports.logChat = logChat;
const getLoggedChat = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const [entries] = yield logging.getEntries({
        filter: `
      logName = "projects/${logging.projectId}/logs/${log}"
      AND labels.email = "${email}"
    `,
        orderBy: 'timestamp desc',
        pageSize: 10,
    });
    return entries.map(entry => entry.data);
});
exports.getLoggedChat = getLoggedChat;
