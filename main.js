const tableBody = document.getElementById('calendar-table');
const textDate = document.getElementById('text-date');
const prevBtn = document.getElementById('prev-month');
const nextBtn = document.getElementById('next-month');
const quickEventModal = document.getElementById('quick-event');
const quickEventInput = document.querySelector('#quick-event input');
const fullEventModal = document.getElementById('full-event');
const currentDate = new Date();
const monthArr = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
let currentCell;

// Main functions

// Метод, который рендерит таблицу с днями для заданного месяца
function drawCalendar(date) {
	const month = date.getMonth();
	const year = date.getFullYear();
	const firstDay = getDayNumber(new Date(year, month, 1));
	const lastDay = getDayNumber(new Date(year, month + 1, 0));
	const lastDayNumber = (new Date(year, month + 1, 0)).getDate();
	let dateHelper = new Date(year, month);
	let table = '<tr>';

	// Если месяц начинается не с 0(пн), тогда заполняем ячейки днями из предыдущего месяца
	if (firstDay !== 0) {
		for (let i = 0; i < firstDay; i++) {
			let prevDate = new Date(year, month, - (firstDay - 1) + i);
			let dayId = `${prevDate.getFullYear()}-${prevDate.getMonth() + 1}-${prevDate.getDate()}`;
			table += createCell(dayId, prevDate);
		}
	}

	// Ячейки с днями из текущего месяца
	while (dateHelper.getMonth() === month) {
		let dayId = `${dateHelper.getFullYear()}-${dateHelper.getMonth() + 1}-${dateHelper.getDate()}`;
		table += createCell(dayId, dateHelper);

		// вс, последний день - создание новой строки, если это не последний день месяца
		if (getDayNumber(dateHelper) % 7 === 6 && dateHelper.getDate() !== lastDayNumber) {
			table += '</tr><tr>';
		}

		dateHelper.setDate(dateHelper.getDate() + 1);
	}

	// Если месяц заканчивается не в 6(вс), тогда заполняем ячейки днями из сдедующего месяца
	if (lastDay !== 6) {
		for (let i = 0; i < 6 - lastDay; i++) {
			let nextDate = new Date(year, month + 1, i + 1);
			let dayId = `${nextDate.getFullYear()}-${nextDate.getMonth() + 1}-${nextDate.getDate()}`;
			table += createCell(dayId, nextDate);
		}
	}

	// Закрыли таблицу
	table += '</tr>';

	tableBody.innerHTML = table;

	// Обновление информации в блоке с переключением месяцев
	textDate.innerText = `${date.toLocaleString('ru-ru', { month: 'long' })} ${year}`;
	textDate.dataset.currentDate = date;
	prevBtn.dataset.newDate = new Date(year, month - 1);
	nextBtn.dataset.newDate = new Date(year, month + 1);
}

// Метод для кнопок, которые переключают месяцы
function changeMonth(event) {
	const date = new Date(event.target.dataset.newDate);

	fullEventModal.classList.remove('show');
	drawCalendar(date);
}

// Метод для быстрого добавления события
function quickAdd() {
	const userInput = quickEventInput.value;

	if (userInput.length === 0) {
		alert('Поле быстрого создания события не должно быть пустым');
		return;
	}

	// Разбиваем ввод юзера по запятым и проверям, что сначала указана валидная дата
	const inputArr = userInput.split(';');
	const dateArr = inputArr[0].trim().split(' ');

	if (dateArr.length === 1) {
		alert('Пример правильного формата ввода: "20 июля; Событие; Участники; Описание" (без кавычек)');
		return;
	}

	const day = parseInt(dateArr[0]);
	const month = monthArr.indexOf(dateArr[1].toLowerCase());

	if (isNaN(day) || month === -1) {
		alert('Пример правильного формата ввода: "20 июля; Событие; Участники; Описание" (без кавычек)');
		return;
	}

	// Формируем данные для записи в localStorage
	const dateHelper = new Date(currentDate.getFullYear(), month, day);
	const key = `${dateHelper.getFullYear()}-${dateHelper.getMonth() + 1}-${dateHelper.getDate()}`;
	const eventObj = {
		title: inputArr[1] ? inputArr[1].trim() : '',
		participants: inputArr[2] ? inputArr[2].trim() : '',
		description: inputArr[3] ? inputArr[3].trim() : ''
	};

	// Запись в localStorage и перерендер текущего месяца
	saveToStorage(key, JSON.stringify(eventObj));
	drawCalendar(new Date (textDate.dataset.currentDate));

	// Закрываем модалку и чистим инпут
	quickEventModal.classList.remove('show');
	quickEventInput.value = '';
}

// Метод показывает модалку с данными или пустую
function showModal(event) {
	if (quickEventModal.classList.contains('show')) quickEventModal.classList.remove('show');

	let target = event.target;

	// Нужны только td
	while (target.tagName !== 'TD') {
		target = target.parentNode;
	}
	currentCell = target;

	// Делаем выделенной всегда текущую ячейку
	const selectedCell = document.querySelector('td.selected');
	if (selectedCell) selectedCell.classList.remove('selected');
	target.classList.add('selected');

	// Контент для модалки
	const storageKey = target.dataset.dayId;

	if (target.classList.contains('has-event')) { // случай, когда модалка должна быть с данными
		const storageObj = getFromStorage(storageKey);
		const dateArr = storageKey.split('-');
		const readableDate = `${dateArr[2]} ${monthArr[parseInt(dateArr[1]) - 1]}`;

		for (let key in storageObj) {
			if (storageObj[key]) {
				setDataAndHide(`event-${key}`, `event-${key}-input`, storageObj[key]);
			}
		}

		setDataAndHide('event-date', 'event-date-input', readableDate);
	} else { // случай, когда модалка должна быть пустой
		document.querySelectorAll('#full-event [placeholder]').forEach(function (element) {
			element.value = '';
			element.classList.remove('hide');
		});
		document.querySelectorAll('#full-event div[id]').forEach(function (element) {
			element.innerText = '';
			element.classList.add('hide');
		});
	}

	// Расположение модалки на экране
	const boundingRect = target.getBoundingClientRect();
	const topDistance = boundingRect.top + window.pageYOffset;
	const leftDistance = boundingRect.left + window.pageXOffset;
	const elemWidth = boundingRect.width;

	fullEventModal.classList.add('show');
	const modalBoundingRect = fullEventModal.getBoundingClientRect();

	if ((window.innerWidth - (leftDistance + elemWidth)) > 360) { // размещение справа от ячейки
		fullEventModal.classList.remove('right-tail');
		fullEventModal.classList.add('left-tail');
		fullEventModal.style.cssText = `top: ${topDistance - 20}px; left: ${leftDistance + elemWidth + 14}px`;
	} else if (leftDistance > 360) { // размещение слева от ячейки
		fullEventModal.classList.remove('left-tail');
		fullEventModal.classList.add('right-tail');
		fullEventModal.style.cssText = `top: ${topDistance - 20}px; left: ${leftDistance - modalBoundingRect.width - 14}px`;
	} else { // размещение по центру для маленьких экранов
		fullEventModal.classList.remove('right-tail');
		fullEventModal.classList.remove('left-tail');
		fullEventModal.style.cssText = `top: ${(window.innerHeight / 2 + window.pageYOffset) - modalBoundingRect.height / 2}px; left: ${window.innerWidth / 2 - modalBoundingRect.width / 2}px`;
	}
}

function saveEventModal() {
	let inputValArr = [];

	document.querySelectorAll('#full-event [placeholder]').forEach(function (element) {
		inputValArr.push(element.value);
	});

	if (inputValArr[1].length === 0) {
		alert('Поле даты не должно быть пустым');
		return;
	}

	const dateArr = inputValArr[1].trim().split(' ');

	if (dateArr.length === 1) {
		alert('Пример правильного формата ввода: "День месяц год" (без кавычек)');
		return;
	}

	const day = parseInt(dateArr[0]);
	const month = monthArr.indexOf(dateArr[1].toLowerCase());
	const year = parseInt(dateArr[2]);

	if (isNaN(day) || month === -1) {
		alert('Пример правильного формата ввода: "День месяц год" (без кавычек)');
		return;
	}

	// Формируем данные для записи в localStorage
	const dateHelper = new Date(isNaN(year) ? currentDate.getFullYear() : year, month, day);
	const key = `${dateHelper.getFullYear()}-${dateHelper.getMonth() + 1}-${dateHelper.getDate()}`;
	const eventObj = {
		title: inputValArr[0] ? inputValArr[0].trim() : '',
		participants: inputValArr[2] ? inputValArr[2].trim() : '',
		description: inputValArr[3] ? inputValArr[3].trim() : ''
	};

	// Чистка старой записи (если есть), запись в localStorage и перерендер текущего месяца
	removeFromStorage(currentCell.dataset.dayId);
	saveToStorage(key, JSON.stringify(eventObj));
	drawCalendar(new Date (textDate.dataset.currentDate));

	// Закрываем модалку
	fullEventModal.classList.remove('show');
}

// END main functions

// Helpers

// Локализированный номер дня от 0(пн) до 6(вс)
function getDayNumber(date) {
	let day = date.getDay();
	if (day === 0) day = 7;
	return day - 1;
}

// Метод для записи в localStorage
function saveToStorage(key, value) {
	if (typeof(Storage) === undefined) {
		alert('К сожалению, нет поддержки localStorage');
		return;
	}

	localStorage.setItem(key, value);
}

// Читаем с localStorage
function getFromStorage(key) {
	if (typeof(Storage) === undefined) {
		alert('К сожалению, нет поддержки localStorage');
		return;
	}

	return JSON.parse(localStorage.getItem(key));
}

// Удаление с localStorage
function removeFromStorage(key) {
	if (typeof(Storage) === undefined) {
		alert('К сожалению, нет поддержки localStorage');
		return;
	}

	localStorage.removeItem(key);
}

// Формирование ячейки таблицы, с учетом данных о событии
function createCell(dayId, date) {
	const storageObj = getFromStorage(dayId);
	if (storageObj !== null) {
		return `<td data-day-id="${dayId}" class="has-event">
									<div>${date.getDate()}</div>
									<div class="event-data">
									${storageObj.title ? `<strong>${storageObj.title}</strong>` : ''}
									${storageObj.participants ? `<div>${storageObj.participants}</div>` : ''}
									${storageObj.description ? `<div>${storageObj.description}</div>` : ''}
									</div>
									</td>`;
	} else {
		return `<td data-day-id="${dayId}"><div>${date.getDate()}</div></td>`;
	}
}

// Заполняем конкретное поле модалки инфой и скрываем инпут
function setDataAndHide(divId, inputId, data) {
	let div = document.getElementById(divId);
	let input = document.getElementById(inputId);

	input.value = data;
	input.classList.add('hide');

	div.innerText = data;
	div.classList.remove('hide');
}

// END helpers

// EventListeners

// Для кнопок переключения месяцев
prevBtn.addEventListener('click', changeMonth);
nextBtn.addEventListener('click', changeMonth);
document.getElementById('today-btn').addEventListener('click', function () {
	fullEventModal.classList.remove('show');
	drawCalendar(currentDate);
});

// Для быстрого добавления события в календарь
document.getElementById('quick-event-btn').addEventListener('click', function () {
	if (quickEventModal.classList.contains('show')) return;
	if (fullEventModal.classList.contains('show')) fullEventModal.classList.remove('show');

	quickEventModal.classList.add('show');
});
document.querySelector('#quick-event button').addEventListener('click', quickAdd);

// Кнопки закрытия модалок
Array.from(document.getElementsByClassName('close')).forEach(function(element) {
	element.addEventListener('click', function () {
		this.parentNode.classList.remove('show');
	});
});

// Через делигирование добавим EventListeners всем будущим td
tableBody.addEventListener('click', showModal);

// Модалки события
document.querySelectorAll('#full-event div[id]').forEach(function (element) {
	element.addEventListener('click', function () {
		this.classList.add('hide');
		document.getElementById(`${this.id}-input`).classList.remove('hide');
	});
});

document.getElementById('event-save').addEventListener('click', saveEventModal);

document.getElementById('event-delete').addEventListener('click', function () {
	removeFromStorage(currentCell.dataset.dayId);
	drawCalendar(new Date (textDate.dataset.currentDate));
	fullEventModal.classList.remove('show');
});

// END eventListeners

drawCalendar(currentDate);