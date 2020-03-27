const generateMessage = (username, text, className = "") => {
	return {
		username,
		text,
		className,
		createdAt: new Date().getTime()
	};
};

const generateLocationMessage = (username, url, className = "") => {
	return {
		username,
		url,
		className,
		createdAt: new Date().getTime()
	};
};

module.exports = {
	generateMessage,
	generateLocationMessage
};
