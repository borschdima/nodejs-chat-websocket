const socket = io();

// elements
const $form = document.querySelector("form");
const $formBtn = document.querySelector("form button");
const $formInput = document.querySelector("form input");
const $locationBtn = document.querySelector("#locationBtn");

// templates
const $messages = document.querySelector("#messages");
const $sidebar = document.querySelector("#sidebar");
const messageTemplate = document.querySelector("#message-template").innerHTML;
const adminMessageTemplate = document.querySelector("#admin-message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoScroll = () => {
	// New message element
	const $newMessage = $messages.lastElementChild;

	// Height of the new message
	const newMessageStyles = getComputedStyle($newMessage);
	const newMessageMargin = parseInt(newMessageStyles.marginBottom);
	const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

	// Visible height
	const visibleHeight = $messages.offsetHeight;

	// Height of messages container
	const containerHeight = $messages.scrollHeight;

	// How far have I scrolled?
	const scrollOffset = $messages.scrollTop + visibleHeight;

	if (containerHeight - newMessageHeight <= scrollOffset) {
		$messages.scrollTop = containerHeight;
	}
};

locationBtn.addEventListener("click", () => {
	if (!navigator.geolocation) {
		return alert("Geolocation is not supported by your browser!");
	}

	$locationBtn.setAttribute("disabled", "disabled");

	navigator.geolocation.getCurrentPosition(({ coords }) => {
		const latitude = coords.latitude;
		const longitude = coords.longitude;

		socket.emit("sendLocation", { latitude, longitude }, () => {
			console.log("Location shared!");
			$locationBtn.removeAttribute("disabled");
		});
	});
});

$form.addEventListener("submit", e => {
	e.preventDefault();
	$formBtn.setAttribute("disabled", "disabled");
	const message = $formInput.value;

	socket.emit("sendMessage", message, msg => {
		$formBtn.removeAttribute("disabled");
		$formInput.value = "";
		$formInput.focus();

		console.log("The message was delivered: ", msg);
	});
});

socket.on("message", ({ username, text, createdAt }) => {
	const html = Mustache.render(messageTemplate, {
		username,
		message: text,
		createdAt: moment(createdAt).format("HH:mm")
	});
	$messages.insertAdjacentHTML("beforeend", html);
	autoScroll();
});

socket.on("admin-message", text => {
	const html = Mustache.render(adminMessageTemplate, {
		text
	});
	$messages.insertAdjacentHTML("beforeend", html);
	autoScroll();
});

socket.on("location", ({ username, url, createdAt }) => {
	const html = Mustache.render(locationTemplate, {
		username,
		url,
		createdAt: moment(createdAt).format("HH:mm")
	});
	$messages.insertAdjacentHTML("beforeend", html);
	autoScroll();
});

socket.on("roomData", ({ room, users }) => {
	const html = Mustache.render(sidebarTemplate, {
		room,
		users
	});
	$sidebar.innerHTML = html;
});

socket.emit("join", { username, room }, error => {
	if (error) {
		alert(error);
		location.href = "/";
	}
});
