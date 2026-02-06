const sanitize = (str) => String(str).replace(/[^a-zA-Z0-9_-]/g, "_");

export default sanitize;
