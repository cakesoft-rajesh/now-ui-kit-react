import CryptoJS from "crypto-js";
import config from "../config";

export const encrypt = (string) => {
  var base64 = CryptoJS.AES.encrypt(string, config.REACT_APP_SECRET).toString();
  var parsedData = CryptoJS.enc.Base64.parse(base64);
  var hex = parsedData.toString(CryptoJS.enc.Hex);
  return hex;
}

export const decrypt = (cipherText) => {
  var reb64 = CryptoJS.enc.Hex.parse(cipherText);
  var bytes = reb64.toString(CryptoJS.enc.Base64);
  var decrypt = CryptoJS.AES.decrypt(bytes, config.REACT_APP_SECRET);
  var plain = decrypt.toString(CryptoJS.enc.Utf8);
  return plain;
}

export const _getFormatAddress = (address) => {
  address = address.slice(2, address.length);
  let addressStart = address.slice(0, 4);
  let addressEnd = address.slice(address.length - 4, address.length);
  return `0x${addressStart}...${addressEnd}`;
}

function _getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const getUid = async function (length, type) {
  let uid = "";
  let chars = "";
  if (type === "numeric") {
    chars = "123456789";
  } else if (type === "alphaNumeric") {
    chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789";
  } else if (type === "alphaNumericWithSmallLetter") {
    chars = "abcdefghijklmnopqrstuvwxyz123456789";
  }
  const charsLength = chars.length;
  for (let i = 0; i < length; ++i) {
    uid += chars[_getRandomInt(0, charsLength - 1)];
  }
  return uid;
}

export const YouTubeGetID = (url) => {
  url = url.split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
  return url[2] !== undefined ? url[2].split(/[^0-9a-z_]/i)[0] : url[0];
};

export const getQueryStringParams = (query) => {
  return query
    ? (/^[?#]/.test(query) ? query.slice(1) : query)
      .split("&")
      .reduce((params, param) => {
        let [key, value] = param.split("=");
        params[key] = value
          ? decodeURIComponent(value.replace(/\+/g, " "))
          : "";
        return params;
      }, {})
    : {};
};

export const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export const smallFirstLetter = (string) => {
  return string.charAt(0).toLowerCase() + string.slice(1);
};

export const setAuthorizationHeader = (authorization) => {
  localStorage.setItem("authorization", "bearer " + authorization);
};

export const getAuthorizationHeader = () => {
  return localStorage.getItem("authorization");
};

export const setMarketplaceAuthorizationHeader = (authorization) => {
  localStorage.setItem("marketplaceAuthorization", "bearer " + authorization);
};

export const getMarketplaceAuthorizationHeader = () => {
  return localStorage.getItem("marketplaceAuthorization");
};

export const setPermissions = (role) => {
  localStorage.setItem("permission", role);
};

export const getPermissions = () => {
  return localStorage.getItem("permission");
};

export const setUsername = (username) => {
  let encodedString = btoa(username);
  localStorage.setItem("username", encodedString);
};

export const getUsername = () => {
  let decodedString = atob(localStorage.getItem("username"));
  return decodedString;
};

export const setChatAuthorizationHeader = (token) => {
  localStorage.setItem("chatAuthorizationHeader", token);
};

export const getChatAuthorizationHeader = () => {
  return localStorage.getItem("chatAuthorizationHeader");
};

export const setAuthUser = (user) => {
  localStorage.setItem("authUser", JSON.stringify(user));
};

export const getAuthUser = () => {
  return JSON.parse(localStorage.getItem("authUser"));
};

export const clearLocalStorage = () => {
  localStorage.removeItem("authorization");
};

export const clearFullLocalStorage = () => {
  localStorage.clear();
};

export const convertDateAndTime = (dateTime) => {
  let time = new Date(dateTime).toTimeString().split(" ")[0];
  var ts = time;
  var H = +ts.substr(0, 2);
  var h = H % 12 || 12;
  h = h < 10 ? "0" + h : h;
  var ampm = H < 12 ? " AM" : " PM";
  ts = h + ts.substr(2, 3) + ampm;
  return ts;
};

export const setPageLimit = (limit) => {
  localStorage.setItem("pageLimit", limit);
};

export const getPageLimit = () => {
  return localStorage.getItem("pageLimit");
};


export const getMembershipWithExpiry = () => {
  switch (localStorage.getItem("membershipWithExpiry")) {
    case "true":
      return true;
    case "false":
      return false;
    default:
      return false;
  };
};

export const setZTIAppNameData = (data) => {
  localStorage.setItem("ztiAppNameData", JSON.stringify(data));
};

export const getZTIAppNameData = () => {
  return JSON.parse(localStorage.getItem("ztiAppNameData"));
};

export const maskEmailId = (email) => {
  return email.replace(/^(.)(.*)(.@.*)$/,
    (_, val, val1, val2) => val + val1.replace(/./g, "*") + val2
  );
}