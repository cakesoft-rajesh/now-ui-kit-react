import axios from "axios";
import * as GeneralFunctions from "./GeneralFunctions";
import config from "../config";

export const sendDataToMobileApp = async (message) => {
    window.ReactNativeWebView.postMessage(message);
    // window.location.assign(`${config.REACT_APP_BASE_URL}/reactNativeMessage?message=${message}`);
}

export const request = async (obj, token) => {
    let headers = {};
    let authorization = token ? `Bearer ${token}` : null;
    if (authorization) headers["Authorization"] = authorization;
    try {
        if (obj.params) {
            for (let param in obj.params) {
                if (
                    typeof obj.params[param] === "undefined" ||
                    obj.params[param] === null
                ) {
                    delete obj.params[param];
                }
            }
        }
        const response = await axios.create({
            baseURL: config.REACT_APP_BASE_URL,
            headers: headers,
        })(obj);
        return response.data;
    } catch (error) {
        if (error.response) {
            if (error.response.status === 401) {
                GeneralFunctions.clearFullLocalStorage();
                window.location.assign(`${window.location.origin}/login-page`);
            }
            if (error.response.data && error.response.data.message) {
                if (error.response.data.message === 'Unauthorized') {
                    window.location.assign(`${window.location.origin}/login-page`);
                }
                throw Error(error.response.data.message);
            }
        } else {
            throw Error("Server error.");
        }
        throw Error("Internet error.");
    }
};

export const postWithFormData = async (path, body, accessToken) => {
    try {
        let url = `${config.REACT_APP_CHAT_BASE_URL}${path}`;
        const response = await axios.post(url, body, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            if (error.response.status === 401) {
                GeneralFunctions.clearFullLocalStorage();
                window.location.assign(`${window.location.origin}/login-page`);
            }
            if (error.response.data && error.response.data.message) {
                if (error.response.data.message === 'Unauthorized') {
                    window.location.assign(`${window.location.origin}/login-page`);
                }
                throw Error(error.response.data.message);
            }
        } else {
            throw Error("Server error.");
        }
        throw Error("Internet error.");
    }
};
