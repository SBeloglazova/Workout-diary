"use strict";

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
const button = document.querySelector(".button");

// let map; //отвечает за отображение карты
// let mapEvent; //отвечает за нажатие по карте

//     form.addEventListener("submit", function (e) {
//       //перенесли этот код сюда, тк подпись маркера должна отображаться тогда, когда форму с инф-ей о тренировке отправляют - это настроено у форм автоматически и происходит при нажатии на Enter (у формы есть специальное событие - submit (отправка) - и, когда это событие будет происходить, будет отображаться наш маркер)

//       //при отправке формы страница автоматически обновляется. Сбросим это поведение. В данном случае е - это как раз нажатие Enter-a
//       e.preventDefault();

//       //сделаем так, чтобы после того, как мы ввели какие-то данные и нажали на Enter, наши input-ы очищались

//       inputDistance.value =
//         inputDuration.value =
//         inputCadence.value =
//         inputElevation.value =
//           ""; //пустая строка

//       //благодаря этому console log-y в консоли появляются данные о геометке, которые берутся из внешней переменной
//       console.log(mapEvent);

//       //эта часть кода создает геометки на определенных координатах
//       const { lat, lng } = mapEvent.latlng;
//       L.marker([lat, lng])
//         .addTo(map)
//         .bindPopup(
//           //настроим popup - это подпись, появляющаяся над маркером на карте
//           L.popup({
//             maxWindth: 250,
//             minWidth: 100,
//             autoClose: false, //чтобы при нажатии на другой маркер, подпись к предыдущему не скрывалась
//             closeOnClick: false, //чтобы при нажатии на маркер, подпись к нему не пропадала
//             className: "mark-popup", //присваиваем popup-у класс стилей, заранее созданный в файле css
//           })
//         )
//         .setPopupContent("Тренировка") //текст внутри таблички к popup-y (взяли из методов, унаследованных от слоев, те пишем это к marker-y, но наследует это св-во popap)
//         .openPopup();
//     });

// //при выборе тренировки "бег" у нас пар-р "темп", а при тренировке "велосипед" - "высота". Настроим эти изменения

// //у input-ов есть событие change - когда мы выбираем какой-то другой эл-т из выпадающего списка, оно срабатывает
// inputType.addEventListener("change", function () {
//   inputCadence.closest(".form__row").classList.toggle("form__row--hidden"); //метод toggle проверяет - есть ли такой класс у эл-та, а если есть, то удаляет, если нет - добавляет

//   //есть проблема: эл-т с классом "form__row--hidden" находится не в этой переменной, а рядом - сам инпут находится в ".form__row" (родительском эл-те), поэтому сначала нам нужно добраться до него, потому что именно в этом классе находится класс "form__row--hidden" (добираемся до него посредством метода closest)
//   inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
// });

//Создадим родительский класс Workout и дочерние от него с разными видами тренировок
//здесь мы будем записывать ту информацию, которую получим из input-ов в форме
class Workout {
  //создадим дату, она потребуется для отображения в маркере тренировки на карте
  date = new Date();
  //тк приложение может быть популярным с большим кол-вом пользователей, стоит сделать индивидуальный идентификатор для каждой ттренировки (например, взяли кол-во мс на данный момент, превратили в строку и взяли первые 10 цифр)
  id = (Date.now() + "").slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords; //координаты
    this.distance = distance; //дистанция
    this.duration = duration; //продолжительность
  }

  //создадим метод для того, чтобы в форме при отображении всех тренировок менялась надпись с типом тренировки и датой
  _setDescription() {
    //с помощью этого комментария я могу заставить prettier игнорировать эту часть кода и не форматировать
    //prettier-ignore
    const months = ["January","February","March","April","May","June",
      "July","August","September","October","November","December"];
    //создадим новое св-во
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(
      1
    )}  -  ${months[this.date.getMonth()]} ${this.date.getDate()}`;
  }
}

//класс для бега
class Running extends Workout {
  type = "running"; //на всякий случай, если переменный из нижней части кода тут не сработают
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace(); //вызываем метод здесь для автоматического его запуска
    this._setDescription(); //вызываем метод для генерации правильной подписи к тренировке на форме
  }
  //создадим метод расчета темпа бега
  calcPace() {
    this.pace = this.distance / this.duration;
    return this.pace;
  }
}

//класс для велосипеда
class Cycling extends Workout {
  type = "cycling";
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
    this._setDescription();
  }
  //создадим метод расчета скорости
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

///////Рефакторинг кода отвечающего за создание карты и отображение формы на странице (он закомментирован выше): преобразуем все в класс с функциями//////

class App {
  //создадим несколько приватных переменных с данными
  _map;
  _mapEvent;
  _workouts = []; //массив, который будет содержать наши тренировки
  constructor() {
    //чтобы внизу не приходилось вызывать метод app._getPosition(), а он запускался "автоматически"
    this._getPosition(); //метод сразу же запускается

    //получение данных из Local Storage
    this._getLocalStorage();

    //событие отправки формы (нажатие на Enter), которое вызывает метод _newWorkout
    form.addEventListener("submit", this._newWorkout.bind(this)); //забиндим this, чтобы оно в этой ф-ии ссылалось на наш объект(см.ниже)

    //событие смены вида спорта, которое вызывает метод _togleFeeld
    inputType.addEventListener("change", this._togleFeeld);

    //сделаем плавный переход к нужному маркеру на карте при нажатии на тренировку в форме
    containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));
  }
  //метод для получения геопозиции пользователя, в случае успеха запускается ф-ия _loadMap
  _getPosition() {
    if (navigator.geolocation)
      //тут мы используем метод объекта navigator, который принимает в себя 2 фу-ии - согласия(true) и несогласия(false) пользователя делиться своей геолокацией
      navigator.geolocation.getCurrentPosition(
        //здесь мы передали этот метод просто как обычную ф-ию _loadMap (см.ниже)
        //укажем, что будет значить этот this, используя метод bind - так мы говорим коду, что же такое this. Теперь в этой области видимости this - это как раз сам наш класс App
        this._loadMap.bind(this),
        //модальное окно в случае отказа
        function () {
          alert("Вы не предоставили доступ к геолокации!");
        }
      );
  }

  //эта ф-ия использует this - просто внутри ф-ии, не в объекте, а именно в ф-ии, а когда мы так используем this, он становится undefind в строгом режиме. Поэтому нам надо вручную указать, что будет значить этот this --> используем метод bind (см.обратно в _getPosition)
  _loadMap(position) {
    let { latitude } = position.coords;
    let { longitude } = position.coords;
    const coords = [latitude, longitude];

    this._map = L.map("map").setView(coords, 15);
    console.log(this._map);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this._map);

    //название метода, управляющего нажатием по карте - просто обработчик события, предоставленный документацией конкретной карты. Тут снова используется this, а this в обрабоотчиках событий - это DOM-элемент, с которым мы работаем, а это - не  то, что нам нужно. Поэтому мы берем всю ф-ию с аргументом mapE и переносим в метод _showForm. Таким образом, 2-ой аргумент этого метода - как раз метод _showForm
    this._map.on("click", this._showForm.bind(this)); //как раз тут указываем bind, чтобы он ссылался на наш объект App

    //сделаем так, чтобы при перезагрузке страницы, маркеры с тренировками появлялись одновременно с загрузкой карты
    this._workouts.forEach((work) => {
      this._renderWorkMarker(work); //_renderWorkoutMarker - это метод отображающий все маркеры на карте
    });
  }

  //для появления данных в правой форме после нажатия на карту
  _showForm(mapE) {
    this._mapEvent = mapE;
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  //для переключения полей с бега на велосипед
  _togleFeeld() {
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");

    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
  }

  //для установки геометки с инфой о тренировке
  _newWorkout(e) {
    e.preventDefault(); //сбрасываем стандартное поведение браузера

    //создадим ф-ию, которая будет проверять корректность введенных в input-ы данных (вместо закомментированного куска кода из части //получение данных из форм)
    const validInputs = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp)); //оператор rest (...) дает возможность собирать все возможные аргументы, которые будут передаваться в эту ф-ию в виде массива -> далее перебираем каждый из эл-ов полученного массива с помощью метода массива every -> каждый эл-т массива будем проверять с помощью isFinite

    //создадим ф-ию, которая будет проверять введенные параметры на положительность
    const allPositive = (...inputs) => inputs.every((inp) => inp > 0);

    //получение данных из форм
    const type = inputType.value; //прежде всего определим тип тренировки
    const distance = +inputDistance.value; //получим дистанцию конвертированную в число
    const duration = +inputDuration.value; //продолжительность тренировки конвертированную в число
    const { lat, lng } = this._mapEvent.latlng; //получение координат
    let workout;
    //если тип равен бегу, то
    if (type === "running") {
      const cadence = +inputCadence.value;
      //isFinite(distance) проверяет переменную distance - является ли она числом. Если да, то отдает true
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        return alert("Необходимо ввести целое положительное число!");
      }

      //создадим новый объект тренировки бег
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    if (type === "cycling") {
      const elevation = +inputElevation.value;

      //isFinite(distance) проверяет переменную distance - является ли она числом. Если да, то отдает true
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(elevation)
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      ) {
        return alert("Необходимо ввести целое положительное число!");
      }
      //создадим новый объект тренировки с велосипедом
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    //вызываем метод добавляющий новую тренировку в массив тренировок
    this._workouts.push(workout); //запись в массив новой тренировки
    console.log(this._workouts);

    //вызываем метод создания маркера тренировки на карте
    this._renderWorkMarker(workout);

    //вызываем метод отображения всех тренировок в форме
    this._renderWorkout(workout);

    //вызываем метод очистки формы после отправки
    this._hideForm();

    //вызываем метод, позволяющий сохранять наши данные даже после обновления страницы
    this._setLocalStorage();

    this.reset.bind(this);
  }

  //отображение маркера тренировки на карте поместим в отдельный метод
  _renderWorkMarker(workout) {
    L.marker(workout.coords)
      .addTo(this._map)
      .bindPopup(
        L.popup({
          maxWindth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: "mark-popup",
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃" : "🚴‍♀️"}${workout.description}`
      ) //сюда можно писать только строки
      .openPopup();
  }

  //создадим отдельный метод для очистки input-ов после отправки формы с тренировкой
  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        "";
    form.classList.add("hidden");
    button.classList.remove("hidden");
    button.addEventListener("click", this.reset());
  }
  //создадим новый метод для отображение списка тренировок
  _renderWorkout(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === "running" ? "🏃" : "🚴‍♀️" //используем тернарный оператор для смены эмодзи в зависимости от тренировки
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">км</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">мин</span>
    </div>`;

    if (workout.type === "running") {
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span> 
            <span class="workout__unit">км/мин</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">шаг/мин</span>
          </div>
        </li>
      `;
    }

    if (workout.type === "cycling") {
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">км/час</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevation}</span>
            <span class="workout__unit">м</span>
          </div>
        </li> 
      `;
    }
    //осталось вывести всю эту инф-ию в форму
    form.insertAdjacentHTML("afterend", html);
  }

  //метод для осуществления плавного скролла к нужной тренировке
  _moveToPopup(e) {
    const workoutEL = e.target.closest(".workout"); //получаем li со всей инф-ей о тренировке. Кроме того там есть id, которым мы сейчас и вооспользуемся для того, чтобы находить с помощью этого id нужную нам тренировку в массиве workout
    //если нажимаем где-то вне тренировки, те в области, где нет класса workout, в консоль выводятся бесконечные null. Избавимся от этого поведения
    if (!workoutEL) return;

    //найдем нужную нам тренировку
    const workout = this._workouts.find(
      (work) => work.id == workoutEL.dataset.id //ищем по массиву с тренировками (_workouts) переменную с нужным нам id
    );
    console.log(workout); //получаем нужный нам объект (Running{datE, coords etc} или Cycling{} в зависимости от тренировки)

    //планый скролл к маркеру
    //обращаемся к переменной с картой (this._map) и пользуемся методом setView (1-ый аргумент - координаты, которые записаны в переменной workout.coords, 2-ой аргумент - зум, 3-ий аргумент - опции в желтых фигурных скобках)
    this._map.setView(workout.coords, 16, {
      animate: true, //анимация
      pan: { duration: 1 }, //продолжительность ее
    });
  }

  //создадим метод - сохраняющий все наши данные после обновления страницы
  _setLocalStorage() {
    //воспользуемся API,которое нам предоставляет браузер - localStorage
    localStorage.setItem("workouts", JSON.stringify(this._workouts)); //1-ый аргумент - название того, что мы будем хранить, а 2-ой аргумент - в виде строки - что именно будет храниться. Тк нам нужно хранить объект, то используем метод JSON.stringify для преобразования объекта в строку
  }

  //метод для получения данных из локального хранилища (Local Storage)
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts")); //конвертируем данные, полученные через JSON.stringify обратно в объекты
    console.log(data);

    //если каких-то данных нет, то и делать ничего не надо
    if (!data) return;

    //обращаемся к переменной со всеми тренировками и она должна быть равна данным (data)
    this._workouts = data;

    //теперь нужно отрендерить - вывести на страницу все эти тренировки
    this._workouts.forEach((work) => {
      this._renderWorkout(work); //_renderWorkout - это метод отображающий все тренировки в форме
    });

    button.classList.remove("hidden");
    this.reset();
  }

  //создадим метод, очищающий наш Local Storage
  reset() {
    button.addEventListener("click", function () {
      localStorage.removeItem("workouts");
      location.reload();
    });
  }
}

//запуск приложения
const app = new App();
