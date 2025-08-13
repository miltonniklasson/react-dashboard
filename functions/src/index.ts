/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
// Node 18+ provides global fetch; no need for node-fetch polyfill.

// Environment variable (configure via: firebase functions:config:set recaptcha.secret="YOUR_SECRET")
// Access with process.env.RECAPTCHA_SECRET after mapping config if using functions:config.
// For simplicity, read from process.env directly; ensure it's set in deployment environment.

const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

interface RecaptchaResponse {
	success: boolean;
	challenge_ts?: string;
	hostname?: string;
	score?: number;
	action?: string;
	"error-codes"?: string[];
}

export const verifyRecaptcha = onRequest({cors: true}, async (req, res) => {
	if (req.method !== "POST") {
		res.status(405).json({error: "METHOD_NOT_ALLOWED"});
		return;
	}
	const secret = process.env.RECAPTCHA_SECRET;
	if (!secret) {
		logger.error("Missing RECAPTCHA_SECRET environment variable");
		res.status(500).json({error: "SERVER_MISCONFIGURED"});
		return;
	}
	const token = req.body?.token;
	if (!token || typeof token !== "string") {
		res.status(400).json({error: "TOKEN_REQUIRED"});
		return;
	}
	try {
		const params = new URLSearchParams();
		params.append("secret", secret);
		params.append("response", token);
		// Optionally include remoteip: params.append("remoteip", req.ip || "");
		const verifyResp = await fetch(RECAPTCHA_VERIFY_URL, {method: "POST", body: params});
		const data = (await verifyResp.json()) as RecaptchaResponse;
		if (!data.success) {
			logger.warn("Recaptcha failed", data);
					res.status(200).json({success: false, error: data["error-codes"] || []});
			return;
		}
				res.status(200).json({success: true});
	} catch (err: unknown) {
		logger.error("Recaptcha verify error", err);
				res.status(500).json({error: "INTERNAL_ERROR"});
	}
});

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
